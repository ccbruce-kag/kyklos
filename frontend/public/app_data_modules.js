    // ─── DbMan ───
    var dbmanCurrentConn = null;
    function rebuildDbManMenu() {
      $.get('/dbman/connections', function (res) {
        if (res.code !== 0) return;
        var conns = res.data || [];
        var html = '';
        conns.forEach(function (c) {
          var icon = c.db_type === 'sqlite' ? 'bx-file' : c.db_type === 'mysql' ? 'bx-data' : 'bx-server';
          html += '<li class="menu-item dbman-menu-conn" data-conn-id="' + c.id + '">' +
            '<a href="#" class="menu-link dbman-menu-conn-link" data-conn-id="' + c.id + '">' +
            '<i class="menu-icon tf-icons bx ' + icon + '"></i>' +
            '<div class="text-truncate">' + escHtml(c.name) + '</div></a></li>';
        });
        $('#menuDbManConnItems').html(html);
      });
    }
    function loadDbManConnections() {
      $.get('/dbman/connections', function (res) {
        if (res.code !== 0) return;
        var conns = res.data || [];
        var html = '';
        conns.forEach(function (c) {
          var icon = c.db_type === 'sqlite' ? 'bx-file' : c.db_type === 'mysql' ? 'bx-data' : 'bx-server';
          html += '<div class="dbman-conn-item p-1 mb-1" data-conn-id="' + c.id + '" data-conn=\'' + JSON.stringify(c).replace(/'/g, '&#39;') + '\' style="cursor:pointer;border-radius:4px;background:var(--bs-tertiary-bg)">' +
            '<div class="d-flex justify-content-between align-items-center px-2 py-1">' +
            '<span style="font-size:.8125rem"><i class="bx ' + icon + ' me-1"></i>' + escHtml(c.name) + '<br><small class="text-muted">' + c.db_type + '</small></span>' +
            '<button class="btn btn-sm btn-outline-danger dbman-del-conn" data-id="' + c.id + '"><i class="bx bx-trash"></i></button>' +
            '</div></div>';
        });
        var lang = i18n[currentLang] || i18n.en;
        var emptyHtml = '<div class="text-muted text-center p-3" style="font-size:.8125rem">' + escHtml(lang.dbmanNoConnections || 'No connections yet') + '<br><button class="btn btn-sm btn-outline-primary mt-2" id="dbmanShowAddForm"><i class="bx bx-plus me-1"></i>' + escHtml(lang.dbmanNewConnection || 'New Connection') + '</button></div>' +
          '<div class="mt-2"><button class="btn btn-sm btn-outline-info w-100" id="dbmanQuickConnectLocal"><i class="bx bx-plug me-1"></i>' + escHtml(lang.dbmanQuickConnectLocal || 'Quick connect to local database') + '</button></div>';
        $('#dbmanConnList').html(html || emptyHtml);
      });
    }
    function showDbManConnForm(conn) {
      $('#dbmanConnView').hide();
      $('#dbmanConnForm').show();
      var lang = i18n[currentLang] || i18n.en;
      if (conn) {
        $('#dbmanFormTitle').text(lang.dbmanEditConnection || 'Edit Connection');
        $('#dbmanEditConnId').val(conn.id);
        $('#dbmanFormName').val(conn.name);
        $('#dbmanFormType').val(conn.db_type).trigger('change');
        $('#dbmanFormFilePath').val(conn.file_path || '');
        $('#dbmanFormHost').val(conn.host || '');
        $('#dbmanFormPort').val(conn.port || '');
        $('#dbmanFormDb').val(conn.database_name || '');
        $('#dbmanFormUser').val(conn.username || '');
        $('#dbmanFormPass').val('');
        $('#dbmanFormTrustCert').prop('checked', conn.trust_server_cert);
      } else {
        $('#dbmanFormTitle').text(lang.dbmanNewConnection || 'New Connection');
        $('#dbmanEditConnId').val('');
        $('#dbmanFormName').val('');
        $('#dbmanFormType').val('sqlite').trigger('change');
        $('#dbmanFormFilePath').val('');
        $('#dbmanFormHost').val('');
        $('#dbmanFormPort').val('');
        $('#dbmanFormDb').val('');
        $('#dbmanFormUser').val('');
        $('#dbmanFormPass').val('');
        $('#dbmanFormTrustCert').prop('checked', false);
      }
      $('#dbmanFormResult').empty();
    }
    function dbmanConnPayload(conn) {
      var data = { db_type: conn.db_type, file_path: conn.file_path || '' };
      if (conn.db_type !== 'sqlite') {
        data.host = conn.host;
        data.port = conn.port;
        data.username = conn.username;
        data.password = conn.password;
        data.database_name = conn.database_name;
        data.trust_server_cert = conn.trust_server_cert ? '1' : '0';
      }
      return data;
    }
    function dbmanDatabaseLabel(conn) {
      var lang = i18n[currentLang] || i18n.en;
      if (!conn) return lang.dbmanDatabase || 'Database';
      if (conn.db_type === 'sqlite') return conn.file_path || conn.name || 'SQLite';
      return conn.database_name || conn.name || conn.host || (lang.dbmanDatabase || 'Database');
    }
    function renderDbManSchemaLoading(conn) {
      var lang = i18n[currentLang] || i18n.en;
      $('#dbmanSchemaTree').show().html(
        '<div class="text-muted mb-1" style="font-size:.75rem">' + escHtml(lang.dbmanSchema || 'Database Schema') + '</div>' +
        '<div class="dbman-schema-tree" style="font-size:.8125rem">' +
        '<div class="py-1"><i class="bx bx-data me-1"></i><strong>' + escHtml(dbmanDatabaseLabel(conn)) + '</strong></div>' +
        '<div class="ms-3 text-muted py-1">' + escHtml(lang.loading || 'Loading...') + '</div>' +
        '</div>'
      );
    }
    function renderDbManSchemaError(conn, msg) {
      var lang = i18n[currentLang] || i18n.en;
      $('#dbmanSchemaTree').show().html(
        '<div class="text-muted mb-1" style="font-size:.75rem">' + escHtml(lang.dbmanSchema || 'Database Schema') + '</div>' +
        '<div class="dbman-schema-tree" style="font-size:.8125rem">' +
        '<div class="py-1"><i class="bx bx-data me-1"></i><strong>' + escHtml(dbmanDatabaseLabel(conn)) + '</strong></div>' +
        '<div class="ms-3 text-danger py-1">' + escHtml(msg) + '</div>' +
        '</div>'
      );
    }
    function renderDbManSchemaTree(conn, tables) {
      var lang = i18n[currentLang] || i18n.en;
      tables = tables || [];
      var tableHtml = '';
      if (!tables.length) {
        tableHtml = '<div class="text-muted py-1 ms-4">' + escHtml(lang.dbmanNoTables || 'No tables') + '</div>';
      } else {
        tableHtml = '<div id="dbmanTableList" class="d-flex flex-column py-1">';
        tables.forEach(function (t, idx) {
          tableHtml += '<div class="dbman-table-chip py-1 ps-4" data-table-idx="' + idx + '" data-table="' + encodeURIComponent(t.name) + '" style="cursor:pointer;text-align:left">' +
            '<i class="bx bx-table me-1"></i>' + escHtml(t.name) + '</div>';
        });
        tableHtml += '</div>';
      }
      $('#dbmanSchemaTree').show().html(
        '<div class="text-muted mb-1" style="font-size:.75rem">' + escHtml(lang.dbmanSchema || 'Database Schema') + '</div>' +
        '<div class="dbman-schema-tree" style="font-size:.8125rem">' +
        '<div class="dbman-tree-node py-1" data-tree-target="#dbmanTreeDb" data-open="1" style="cursor:pointer">' +
        '<i class="bx bx-chevron-down me-1 dbman-tree-caret"></i><i class="bx bx-data me-1"></i><strong>' + escHtml(dbmanDatabaseLabel(conn)) + '</strong></div>' +
        '<div id="dbmanTreeDb" class="ms-3">' +
        '<div class="dbman-tree-node py-1" data-tree-target="#dbmanTreeTables" data-open="1" style="cursor:pointer">' +
        '<i class="bx bx-chevron-down me-1 dbman-tree-caret"></i><i class="bx bx-folder-open me-1 dbman-tree-folder"></i>' + escHtml(lang.dbmanTable || 'table') + '</div>' +
        '<div id="dbmanTreeTables" class="ms-3">' + tableHtml + '</div>' +
        '<div class="dbman-tree-node py-1 text-muted" data-tree-target="#dbmanTreeViews" data-open="0" style="cursor:pointer">' +
        '<i class="bx bx-chevron-right me-1 dbman-tree-caret"></i><i class="bx bx-folder me-1 dbman-tree-folder"></i>' + escHtml(lang.dbmanView || 'view') + '</div>' +
        '<div id="dbmanTreeViews" class="ms-3" style="display:none"><div class="text-muted py-1 ms-4">' + escHtml(lang.noData || 'No data') + '</div></div>' +
        '<div class="dbman-tree-node py-1 text-muted" data-tree-target="#dbmanTreeProcedures" data-open="0" style="cursor:pointer">' +
        '<i class="bx bx-chevron-right me-1 dbman-tree-caret"></i><i class="bx bx-folder me-1 dbman-tree-folder"></i>' + escHtml(lang.dbmanStoredProcedure || 'stored procedure') + '</div>' +
        '<div id="dbmanTreeProcedures" class="ms-3" style="display:none"><div class="text-muted py-1 ms-4">' + escHtml(lang.noData || 'No data') + '</div></div>' +
        '<div class="dbman-tree-node py-1 text-muted" data-tree-target="#dbmanTreeFunctions" data-open="0" style="cursor:pointer">' +
        '<i class="bx bx-chevron-right me-1 dbman-tree-caret"></i><i class="bx bx-folder me-1 dbman-tree-folder"></i>' + escHtml(lang.dbmanStoredFunction || 'stored function') + '</div>' +
        '<div id="dbmanTreeFunctions" class="ms-3" style="display:none"><div class="text-muted py-1 ms-4">' + escHtml(lang.noData || 'No data') + '</div></div>' +
        '</div></div>'
      );
    }
    function loadDbManSchema(conn) {
      var data = dbmanConnPayload(conn);
      renderDbManSchemaLoading(conn);
      $.post('/dbman/tables', data, function (res) {
        if (res.code !== 0) { renderDbManSchemaError(conn, res.msg); return; }
        var tables = res.data || [];
        renderDbManSchemaTree(conn, tables);
        tables.forEach(function (t, idx) {
          var cntData = Object.assign({}, data, { sql: 'SELECT COUNT(*) AS cnt FROM "' + t.name + '"' });
          $.post('/dbman/query', cntData, function (cr) {
            if (cr.code === 0 && cr.data && cr.data.rows && cr.data.rows[0]) {
              $('.dbman-table-chip[data-table-idx="' + idx + '"]').append(' <small class="text-muted">(' + cr.data.rows[0][0] + ')</small>');
            }
          });
        });
      });
    }
    // ─── Security ───
    function loadSecurityCvsSources() {
      $.get('/security/cvs/sources', function (res) {
        if (res.code !== 0) return;
        var sources = res.data || [];
        var html = '';
        sources.forEach(function (s) {
          html += '<div class="p-1 mb-1" style="background:var(--bs-tertiary-bg);border-radius:4px">' +
            '<div class="d-flex justify-content-between align-items-center px-2 py-1">' +
            '<div style="font-size:.8125rem"><strong>' + escHtml(s.name) + '</strong><br><small class="text-muted">' + escHtml(s.url) + '</small></div>' +
            '<button class="btn btn-sm btn-outline-danger security-del-cvs" data-id="' + s.id + '"><i class="bx bx-trash"></i></button></div></div>';
        });
        $('#secCvsSourceList').html(html || '<div class="text-muted p-2" style="font-size:.8125rem">尚無來源</div>');
      });
    }
    function loadSecurityScanTasks() {
      $.get('/security/scan/tasks', function (res) {
        if (res.code !== 0) return;
        var tasks = res.data || [];
        var html = '<div class="table-responsive"><table class="table table-sm mb-0" style="font-size:.75rem"><thead><tr><th>名稱</th><th>目標</th><th>狀態</th><th>操作</th></tr></thead><tbody>';
        tasks.forEach(function (t) {
          var statusCls = t.status === 'completed' ? 'bg-label-success' : t.status === 'running' ? 'bg-label-primary' : t.status === 'failed' ? 'bg-label-danger' : 'bg-label-secondary';
          html += '<tr><td>' + escHtml(t.name) + '</td><td><code>' + escHtml(t.target) + '</code></td><td><span class="badge ' + statusCls + '">' + t.status + '</span></td>' +
            '<td>' + (t.status === 'completed' ? '<button class="btn btn-sm btn-outline-info security-view-results" data-id="' + t.id + '"><i class="bx bx-show"></i></button> ' : '') +
            '<button class="btn btn-sm btn-outline-danger security-del-task" data-id="' + t.id + '"><i class="bx bx-trash"></i></button></td></tr>';
        });
        html += '</tbody></table></div>';
        $('#secScanTaskList').html(html || '<div class="text-muted p-2">尚無掃描任務</div>');
      });
    }
    // ─── ApiMan ───
    var apimanBase = '/apiman';
    var apimanCurrentNodeId = null;
    var apimanSelectedFolderId = null;
    var apimanWorkspaces = [];
    var apimanExpanded = {};
    function apimanUrl(path) { return apimanBase + path; }
    (function () {
      if (document.getElementById('apiman-style')) return;
      var s = document.createElement('style');
      s.id = 'apiman-style';
      s.textContent = [
        '.apiman-workspace-toolbar{display:flex;gap:6px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:8px}',
        '.apiman-workspace-tip{border:1px solid rgba(var(--bs-primary-rgb),.25);background:rgba(var(--bs-primary-rgb),.07);color:var(--bs-body-color);border-radius:6px;padding:8px 10px;font-size:.75rem;line-height:1.45;margin-bottom:8px}',
        '.apiman-ws-item{transition:all .12s ease;border:1px solid var(--bs-border-color);cursor:pointer;background:var(--bs-body-bg)}',
        '.apiman-ws-item:hover{border-color:var(--bs-primary);background:rgba(var(--bs-primary-rgb),.04);box-shadow:0 0 0 2px rgba(var(--bs-primary-rgb),.08)}',
        '.apiman-folder-item{margin:2px 0}',
        '.apiman-folder-header,.apiman-req-item{transition:all .12s ease;border-radius:6px;border:1px solid transparent;background:transparent}',
        '.apiman-folder-header:hover,.apiman-req-item:hover{background:rgba(var(--bs-secondary-rgb),.06);border-color:var(--bs-border-color)}',
        '.apiman-folder-header.is-selected{background:rgba(var(--bs-warning-rgb),.12);border-color:rgba(var(--bs-warning-rgb),.35)}',
        '.apiman-req-item.is-active{background:rgba(var(--bs-primary-rgb),.1);border-color:rgba(var(--bs-primary-rgb),.35)}',
        '.apiman-method-badge{font-size:.6rem;font-weight:700;padding:1px 5px;border-radius:3px;letter-spacing:.3px}',
        '.apiman-fold-toggle{width:18px;display:inline-block;text-align:center;cursor:pointer;user-select:none;font-size:.7rem;color:var(--bs-secondary-color);transition:color .12s}',
        '.apiman-fold-toggle:hover{color:var(--bs-primary)}',
        '.apiman-children{margin-left:18px;padding-left:11px;border-left:1px dashed var(--bs-border-color);min-height:8px}',
        '.apiman-tree-line{border-left:1px solid var(--bs-border-color);margin-left:11px}',
        '.apiman-drop-hint{background:rgba(var(--bs-primary-rgb),.06);outline:2px dashed var(--bs-primary)}',
        '.apiman-ws-icon{font-size:.9rem}',
        '.apiman-folder-icon{font-size:.85rem;color:var(--bs-warning)}',
        '.apiman-request-icon{font-size:.75rem;color:var(--bs-info)}',
        '.apiman-empty-dot{width:6px;height:6px;border-radius:50%;background:var(--bs-border-color);display:inline-block;margin:6px 0 4px 5px}',
        '.apiman-node-title{min-width:0;display:flex;align-items:center;gap:4px;font-size:.8125rem}',
        '.apiman-node-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
        '.apiman-node-subtitle{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--bs-secondary-color);font-size:.675rem;max-width:170px;margin-top:1px}',
        '.apiman-node-actions{opacity:.6;transition:opacity .12s}',
        '.apiman-folder-header:hover .apiman-node-actions,.apiman-req-item:hover .apiman-node-actions{opacity:1}',
        '.apiman-toast{position:fixed;right:22px;bottom:22px;z-index:2147483000;min-width:260px;max-width:360px;border-radius:8px;padding:12px 14px;background:#111827;color:#fff;box-shadow:0 12px 34px rgba(15,23,42,.28);font-size:.8125rem;border-left:4px solid #696cff}',
        '.apiman-toast.success{border-left-color:#28c76f}',
        '.apiman-toast.warning{border-left-color:#ffab00}',
        '.apiman-toast.danger{border-left-color:#ea5455}',
        '.apiman-toast-title{font-weight:700;margin-bottom:2px}',
      ].join('');
      document.head.appendChild(s);
    })();
    function showApiManNotice(title, detail, kind) {
      $('.apiman-toast').remove();
      var cls = kind || 'success';
      var html = '<div class="apiman-toast ' + cls + '">' +
        '<div class="apiman-toast-title">' + escHtml(title || 'ApiMan') + '</div>' +
        (detail ? '<div>' + escHtml(detail) + '</div>' : '') + '</div>';
      $('body').append(html);
      setTimeout(function () { $('.apiman-toast').fadeOut(180, function () { $(this).remove(); }); }, 3200);
    }
    function setApiManEmptyLabel(text) {
      $('#apimanEmptyLabel').text(text || '請選擇或建立一個新的工作區');
    }
    function updateApiManRequestTreeItem(nodeId, method, url) {
      var $item = $('.apiman-req-item[data-node-id="' + nodeId + '"]');
      if (!$item.length) return;
      var safeMethod = method || 'GET';
      $item.find('.apiman-method-badge').text(safeMethod);
      var bg = safeMethod === 'GET' ? 'rgba(102,187,106,.15)' : safeMethod === 'POST' ? 'rgba(255,193,7,.2)' : safeMethod === 'DELETE' ? 'rgba(234,84,85,.15)' : 'rgba(3,169,244,.15)';
      var color = safeMethod === 'GET' ? '#2e7d32' : safeMethod === 'POST' ? '#b8860b' : safeMethod === 'DELETE' ? '#c62828' : '#0277bd';
      $item.find('.apiman-method-badge').css({ background: bg, color: color });
      $item.find('.apiman-node-subtitle').text(url && url.trim() ? url.trim() : '尚未設定 URL');
    }
    function loadApiManWorkspaces(done) {
      $.get(apimanUrl('/workspaces'), function (res) {
        if (res.code === 0) {
          apimanWorkspaces = res.data || [];
          if (done) done(apimanWorkspaces);
        }
      });
    }
    function rebuildApiManMenu() {
      $('#menuApiManWsItems').empty();
    }
    function refreshApiManWorkspaceLists() {
      renderApiManTree();
      rebuildApiManMenu();
    }
    function openApiManWorkspaceDialog() {
      var lang = i18n[currentLang] || i18n.en;
      layer.open({
        title: lang.apimanCreateWorkspace || 'Create Workspace',
        area: ['460px', 'auto'],
        content:
          '<div class="p-2">' +
          '<div class="mb-2"><label class="form-label" for="apimanWsNameInput">' + escHtml(lang.apimanWorkspaceName || 'Workspace Name') + '</label>' +
          '<input type="text" class="form-control" id="apimanWsNameInput" placeholder="My Workspace"></div>' +
          '<div class="mb-2"><label class="form-label" for="apimanWsDescInput">' + escHtml(lang.apimanWorkspaceDescription || 'Description') + '</label>' +
          '<textarea class="form-control" id="apimanWsDescInput" rows="3" placeholder="' + escHtml(lang.apimanWorkspaceDescriptionPlaceholder || 'Purpose, environment, or API notes') + '"></textarea></div>' +
          '</div>',
        btn: [lang.apimanCreateWorkspace || 'Create', lang.cancel || 'Cancel'],
        btn1: function () {
          var name = $('#apimanWsNameInput').val().trim();
          var description = $('#apimanWsDescInput').val().trim();
          if (!name) { layer.msg(lang.apimanWorkspaceNameRequired || 'Enter a workspace name', { icon: 2 }); return; }
          $.post(apimanUrl('/workspaces'), { name: name, description: description }, function (res) {
          if (res.code === 0) {
              _hideModal();
              loadApiManWorkspaces(function () {
                renderApiManTree();
                rebuildApiManMenu();
                if (res.data && res.data.id) {
                  renderApiManTreeForWs(res.data.id);
                  showApiManNotice(lang.apimanWorkspaceCreated || '工作區已建立', name, 'success');
                }
              });
            } else {
              layer.alert(res.msg);
            }
          });
        },
        btn2: function () { _hideModal(); }
      });
      setTimeout(function () { $('#apimanWsNameInput').trigger('focus'); }, 50);
    }
    function renderApiManTree() {
      apimanCurrentWsId = null;
      apimanCurrentNodeId = null;
      apimanSelectedFolderId = null;
      $('#apimanRequestCard').hide();
      $('#apimanEmptyState').show();
      setApiManEmptyLabel('請選擇或建立一個新的工作區');
      loadApiManWorkspaces(function (workspaces) {
        var $tree = $('#apimanTreeBody');
        var lang = i18n[currentLang] || i18n.en;
        if (!workspaces.length) {
          $tree.html('<div class="apiman-workspace-tip"><strong>工作區入口</strong><br>這裡只列出工作區；請按下 + 建立工作區後，再進入工作區新增資料夾或 Request。</div>' +
            '<div class="text-muted text-center p-4" style="font-size:.8125rem">' +
            '<i class="bx bx-folder-open" style="font-size:2.2rem;opacity:.25;display:block;margin-bottom:8px"></i>' +
            escHtml(lang.apimanNoWorkspace || 'No workspaces yet') +
            '<br><button class="btn btn-sm btn-outline-primary mt-2" id="apimanCreateFirstWs"><i class="bx bx-plus me-1"></i>' +
            escHtml(lang.apimanCreateFirstWorkspace || 'Create first workspace') + '</button></div>');
          return;
        }
        var html = '<div class="apiman-workspace-toolbar px-1">' +
          '<button class="btn btn-sm btn-primary" id="apimanCreateWsBtn"><i class="bx bx-plus me-1"></i>新增工作區</button>' +
          '<button class="btn btn-sm btn-outline-info" id="apimanImportBtn" title="匯入工作區"><i class="bx bx-import me-1"></i>匯入</button></div>' +
          '<div class="apiman-workspace-tip"><strong>工作區清單</strong><br>點選工作區名稱進入 Collection。進入後再用上方按鈕新增資料夾或 Request；若先選取資料夾，新增項目會放在該資料夾底下。</div>';
        workspaces.forEach(function (ws) {
          html += '<div class="apiman-ws-item p-1 mb-1 rounded" data-ws-id="' + ws.id + '">' +
            '<div class="d-flex justify-content-between align-items-center px-2 py-1">' +
            '<strong style="font-size:.8125rem"><i class="bx bx-folder apiman-ws-icon me-1"></i>' + escHtml(ws.name) + '</strong>' +
            '<div><button class="btn btn-sm btn-outline-danger apiman-del-ws border-0" data-id="' + ws.id + '" title="刪除工作區"><i class="bx bx-trash"></i></button></div>' +
            '</div></div>';
        });
        $tree.html(html);
      });
    }
    function renderApiManTreeForWs(wsId) {
      apimanCurrentWsId = wsId;
      apimanSelectedFolderId = null;
      $('#apimanRequestCard').hide();
      $('#apimanEmptyState').show();
      setApiManEmptyLabel('請選擇或建立一個 Request、資料夾');
      loadApiManVars();
      var ws = (apimanWorkspaces || []).find(function (item) { return String(item.id) === String(wsId); });
      $.get(apimanUrl('/workspaces/' + wsId + '/nodes'), function (res) {
        if (res.code !== 0) return;
        var treeData = res.data || [];
        var html = buildApiManTreeHtml(treeData, 0);
        $('#apimanTreeBody').html(
          '<div class="d-flex justify-content-between align-items-center flex-wrap gap-1 px-1 mb-2">' +
          '<div class="d-flex align-items-center gap-1 min-w-0">' +
          '<button class="btn btn-sm btn-outline-secondary apiman-back-ws" title="返回工作區清單"><i class="bx bx-arrow-back"></i></button>' +
          '<strong class="text-truncate" style="font-size:.8125rem" id="apimanCurrentWsLabel"><i class="bx bx-folder apiman-ws-icon me-1"></i></strong></div>' +
          '<div class="d-flex gap-1 flex-wrap">' +
          '<button class="btn btn-sm btn-outline-primary apiman-add-folder" data-ws="' + wsId + '" title="新增資料夾"><i class="bx bx-folder-plus me-1"></i>資料夾</button>' +
          '<button class="btn btn-sm btn-success apiman-add-req" data-ws="' + wsId + '" title="新增 Request"><i class="bx bx-plus-circle me-1"></i>Request</button>' +
          '<button class="btn btn-sm btn-outline-info apiman-export-ws" data-ws="' + wsId + '" title="匯出"><i class="bx bx-export me-1"></i>匯出</button></div></div>' +
          '<div class="apiman-workspace-tip" id="apimanFolderHint"><strong>目前位置：</strong>工作區根目錄。點資料夾可選取新增位置，再按「資料夾」或「Request」。</div>' +
          (html || '<div class="text-muted p-3 text-center" style="font-size:.8125rem"><i class="bx bx-inbox" style="font-size:1.6rem;opacity:.25;display:block;margin-bottom:4px"></i>空的，點擊上方按鈕新增</div>')
        );
        $('#apimanCurrentWsLabel').html('<i class="bx bx-folder apiman-ws-icon me-1"></i>' + (ws ? escHtml(ws.name) : ''));
      });
    }
    var apimanDragNodeId = null;
    function buildApiManTreeHtml(nodes, depth) {
      var html = '';
      var sorted = (nodes || []).slice().sort(function (a, b) {
        var ta = a.node && a.node.node_type;
        var tb = b.node && b.node.node_type;
        if (ta === 'folder' && tb !== 'folder') return -1;
        if (ta !== 'folder' && tb === 'folder') return 1;
        return 0;
      });
      sorted.forEach(function (item) {
        var nodeId = item.node.id;
        var isExpanded = apimanExpanded[nodeId] !== false;
        if (item.node.node_type === 'folder') {
          var hasChildren = item.children && item.children.length > 0;
          html += '<div class="apiman-folder-item" data-node-id="' + nodeId + '">' +
            '<div class="d-flex justify-content-between align-items-center px-2 py-1 apiman-folder-header" data-node-id="' + nodeId + '" data-node-name="' + escHtml(item.node.name) + '" draggable="true" style="cursor:grab">' +
            '<span class="apiman-node-title">' +
            '<span class="apiman-fold-toggle" data-fold="' + nodeId + '">' + (hasChildren ? (isExpanded ? '▾' : '▸') : '') + '</span>' +
            '<i class="bx ' + (isExpanded ? 'bx-folder-open' : 'bx-folder') + ' apiman-folder-icon me-1"></i>' +
            '<span class="apiman-node-name">' + escHtml(item.node.name) + '</span></span>' +
            '<div class="d-flex gap-1 apiman-node-actions">' +
            '<button class="btn btn-sm btn-outline-info apiman-copy-node border-0 px-1" data-id="' + nodeId + '" title="複製"><i class="bx bx-copy" style="font-size:.8rem"></i></button>' +
            '<button class="btn btn-sm btn-outline-danger apiman-del-node border-0 px-1" data-id="' + nodeId + '"><i class="bx bx-trash" style="font-size:.8rem"></i></button></div>' +
            '</div>' +
            '<div class="apiman-children apiman-drop-zone' + (isExpanded ? '' : ' d-none') + '" data-parent-id="' + nodeId + '">' +
            (hasChildren ? buildApiManTreeHtml(item.children, depth + 1) : '<span class="apiman-empty-dot"></span>') +
            '</div></div>';
        } else {
          var method = item.request ? item.request.method : 'GET';
          var reqName = item.node.name || (item.request && item.request.url) || 'Untitled Request';
          var reqUrl = item.request && item.request.url ? item.request.url : '尚未設定 URL';
          var methodBg = method === 'GET' ? 'rgba(102,187,106,.15)' : method === 'POST' ? 'rgba(255,193,7,.2)' : method === 'DELETE' ? 'rgba(234,84,85,.15)' : 'rgba(3,169,244,.15)';
          var methodColor = method === 'GET' ? '#2e7d32' : method === 'POST' ? '#b8860b' : method === 'DELETE' ? '#c62828' : '#0277bd';
          var activeCls = String(apimanCurrentNodeId || '') === String(nodeId) ? ' is-active' : '';
          html += '<div class="apiman-req-item px-2 py-1' + activeCls + '" style="cursor:grab" data-node-id="' + nodeId + '" draggable="true">' +
            '<div class="d-flex justify-content-between align-items-center">' +
            '<span style="font-size:.75rem;min-width:0;display:block">' +
            '<span class="d-flex align-items-center gap-1 min-w-0"><span class="apiman-method-badge" style="background:' + methodBg + ';color:' + methodColor + '">' + method + '</span>' +
            '<span class="apiman-node-name">' + escHtml(reqName) + '</span></span>' +
            '<span class="apiman-node-subtitle">' + escHtml(reqUrl) + '</span></span>' +
            '<div class="d-flex gap-1 apiman-node-actions">' +
            '<button class="btn btn-sm btn-outline-info apiman-copy-node border-0 px-1" data-id="' + nodeId + '" title="複製"><i class="bx bx-copy" style="font-size:.8rem"></i></button>' +
            '<button class="btn btn-sm btn-outline-danger apiman-del-node border-0 px-1" data-id="' + nodeId + '"><i class="bx bx-trash" style="font-size:.8rem"></i></button></div>' +
            '</div></div>';
        }
      });
      return html;
    }
      var apimanCurrentWsId = null;
      function loadApiManVars() {
        if (!apimanCurrentWsId) return;
        $.get(apimanUrl('/variables/' + apimanCurrentWsId), function (res) {
          if (res.code !== 0) return;
          var vars = res.data || [];
          $('#apimanVarBadge').text(vars.length);
          // Variable hints
          var hints = '';
          vars.forEach(function (v) {
            if (v.enabled !== false) hints += '<code style="background:var(--bs-tertiary-bg);padding:0 4px;border-radius:3px;cursor:pointer" class="apiman-var-insert" data-key="' + escHtml(v.key) + '">{{' + escHtml(v.key) + '}}</code> ';
          });
          $('#apimanVarHints').html(hints || '');
          var $c = $('#apimanVarsList').empty();
          if (!vars.length) {
            $c.html('<div class="text-muted" style="font-size:.8125rem">尚無變數，請新增</div>');
            return;
          }
          vars.forEach(function (v) {
            $c.append(
              '<div class="row g-1 mb-1 apiman-var-row">' +
              '<div class="col-1"><input type="checkbox" class="form-check-input apiman-var-enabled" ' + (v.enabled !== false ? 'checked' : '') + '></div>' +
              '<div class="col-4"><input type="text" class="form-control form-control-sm font-monospace apiman-var-key" value="' + escHtml(v.key) + '" placeholder="Key"></div>' +
              '<div class="col-5"><input type="text" class="form-control form-control-sm font-monospace apiman-var-value" value="' + escHtml(v.value) + '" placeholder="Value"></div>' +
              '<div class="col-2"><button class="btn btn-sm btn-outline-danger apiman-var-del" data-key="' + escHtml(v.key) + '"><i class="bx bx-x"></i></button></div>' +
              '</div>'
            );
          });
        });
      }
      function loadApiManRequest(nodeId) {
        apimanCurrentNodeId = nodeId;
        $.get(apimanUrl('/requests/' + nodeId), function (res) {
          if (res.code !== 0) return;
          var r = res.data;
          $('#apimanMethod').val(r.method || 'GET');
          $('#apimanUrl').val(r.url || '');
          $('#apimanBodyType').val(r.body_type || 'none');
          $('#apimanBody').val(r.body_content || '');
          renderApiManKeyValue('#apimanParamsList', r.query_params, 'apimanParam');
          renderApiManKeyValue('#apimanHeadersList', r.headers, 'apimanHeader');
          // Load auth config
          var auth = {};
          try { auth = r.auth_config ? JSON.parse(r.auth_config) : {}; } catch(e) {}
          loadApiManAuth(auth);
          $('#apimanRequestCard').show();
          $('#apimanEmptyState').hide();
          // Show/hide history button
          $('#apimanHistoryBtn').show();
        });
      }
      function loadApiManAuth(auth) {
        var t = auth.type || 'none';
        $('#apimanAuthType').val(t);
        $('#apimanAuthBadge').text(t === 'none' ? 'none' : t).removeClass('bg-label-secondary bg-label-warning bg-label-info bg-label-primary')
          .addClass(t === 'none' ? 'bg-label-secondary' : 'bg-label-warning');
        $('#apimanAuthBasic,#apimanAuthBearer,#apimanAuthApiKey').hide();
        if (t === 'basic') { $('#apimanAuthBasic').show(); $('#apimanAuthBasicUser').val(auth.username || ''); $('#apimanAuthBasicPass').val(auth.password || ''); }
        if (t === 'bearer') { $('#apimanAuthBearer').show(); $('#apimanAuthBearerToken').val(auth.token || ''); }
        if (t === 'apikey') { $('#apimanAuthApiKey').show(); $('#apimanAuthApiKeyName').val(auth.key_name || 'X-API-Key'); $('#apimanAuthApiKeyValue').val(auth.key_value || ''); $('#apimanAuthApiKeyIn').val(auth.key_in || 'header'); }
      }
      function collectApiManAuth() {
        var t = $('#apimanAuthType').val();
        if (t === 'none') return null;
        var auth = { type: t };
        if (t === 'basic') { auth.username = $('#apimanAuthBasicUser').val(); auth.password = $('#apimanAuthBasicPass').val(); }
        if (t === 'bearer') { auth.token = $('#apimanAuthBearerToken').val(); }
        if (t === 'apikey') { auth.key_name = $('#apimanAuthApiKeyName').val(); auth.key_value = $('#apimanAuthApiKeyValue').val(); auth.key_in = $('#apimanAuthApiKeyIn').val(); }
        return JSON.stringify(auth);
      }
      function applyApiManAuth(authConfig, headers, params) {
        if (!authConfig) return;
        var auth = (typeof authConfig === 'string') ? JSON.parse(authConfig) : authConfig;
        if (auth.type === 'basic' && auth.username) {
          var encoded = btoa(unescape(encodeURIComponent(auth.username + ':' + (auth.password || ''))));
          headers.push({ key: 'Authorization', value: 'Basic ' + encoded, enabled: true });
        } else if (auth.type === 'bearer' && auth.token) {
          headers.push({ key: 'Authorization', value: 'Bearer ' + auth.token, enabled: true });
        } else if (auth.type === 'apikey' && auth.key_name && auth.key_value) {
          if (auth.key_in === 'query') {
            params.push({ key: auth.key_name, value: auth.key_value, enabled: true });
          } else {
            headers.push({ key: auth.key_name, value: auth.key_value, enabled: true });
          }
        }
      }
      function loadApiManHistory(nodeId) {
        $.get(apimanUrl('/requests/' + nodeId + '/history'), function (res) {
          if (res.code !== 0) return;
          var items = res.data || [];
          if (!items.length) { showApiManNotice('尚無歷史紀錄', '此 Request 還沒有送出紀錄。', 'warning'); return; }
          var html = '<div class="table-responsive"><table class="table table-sm table-bordered mb-0" style="font-size:.75rem"><thead><tr><th>#</th><th>Status</th><th>Time</th><th>Elapsed</th><th></th></tr></thead><tbody>';
          items.forEach(function (item) {
            var statusCls = item.status >= 200 && item.status < 300 ? 'text-success' : item.status >= 400 ? 'text-danger' : 'text-warning';
            var encodedItem = encodeURIComponent(JSON.stringify(item));
            html += '<tr><td>' + item.id + '</td><td class="' + statusCls + ' fw-bold">' + (item.status || '?') + '</td><td>' + escHtml(item.created_at) + '</td><td>' + (item.elapsed_ms || '-') + 'ms</td>' +
              '<td><button class="btn btn-sm btn-outline-info apiman-view-history" data-id="' + item.id + '" data-body="' + escHtml(encodedItem) + '"><i class="bx bx-show"></i></button></td></tr>';
          });
          html += '</tbody></table></div>';
          showApiManNotice('歷史紀錄已載入', items.length + ' 筆 Response History', 'success');
          layer.open({ title: 'Response History', content: html, area: ['700px', '60vh'], btn: ['OK'] });
        });
      }
    function renderApiManKeyValue(containerId, jsonData, prefix) {
      var $c = $(containerId).empty();
      var items = [];
      try { items = jsonData ? JSON.parse(jsonData) : []; } catch(e) {}
      if (!items.length) items = [{key:'', value:'', enabled:true}];
      items.forEach(function (item, i) {
        $c.append(
          '<div class="row g-1 mb-1 apiman-kv-row">' +
          '<div class="col-1"><input type="checkbox" class="form-check-input apiman-kv-enabled" ' + (item.enabled !== false ? 'checked' : '') + '></div>' +
          '<div class="col-4"><input type="text" class="form-control form-control-sm font-monospace apiman-kv-key" value="' + escHtml(item.key) + '" placeholder="Key"></div>' +
          '<div class="col-5"><input type="text" class="form-control form-control-sm font-monospace apiman-kv-value" value="' + escHtml(item.value || '') + '" placeholder="Value"></div>' +
          '<div class="col-2"><button class="btn btn-sm btn-outline-danger apiman-kv-del"><i class="bx bx-x"></i></button></div>' +
          '</div>'
        );
      });
    }
    function collectApiManKv(prefix) {
      var items = [];
      $('.' + prefix + '-kv-row').each(function () {
        var key = $(this).find('.apiman-kv-key').val().trim();
        if (!key) return;
        items.push({
          key: key,
          value: $(this).find('.apiman-kv-value').val(),
          enabled: $(this).find('.apiman-kv-enabled').is(':checked')
        });
      });
      return items.length ? JSON.stringify(items) : null;
    }
    // ─── Netplan ───
    var netplanBase = null;
    var netplanBaseCandidates = ['/netplan', '/api/netplan'];
    function netplanUrl(path) { return (netplanBase || '/netplan') + path; }
    function detectNetplanApi(done) {
      if (netplanBase) { if (done) done(); return; }
      var candidates = netplanBaseCandidates.slice();
      function tryNext() {
        if (!candidates.length) { netplanBase = '/netplan'; if (done) done(); return; }
        var base = candidates.shift();
        $.ajax({ url: base + '/configs', dataType: 'json', method: 'GET' })
          .done(function () { netplanBase = base; if (done) done(); })
          .fail(function () { tryNext(); });
      }
      tryNext();
    }
    function loadNetplanInterfaces() {
      $.get('/netplan/interfaces', function (res) {
        var select = $('#netplanInterface');
        var current = select.val();
        select.empty();
        if (Array.isArray(res)) {
          res.forEach(function (iface) {
            select.append('<option value="' + escHtml(iface) + '">' + escHtml(iface) + '</option>');
          });
          if (current && res.indexOf(current) !== -1) select.val(current);
        }
        loadNetplanIfaceInfo();
      }, 'json');
    }
    function loadNetplanIfaceInfo() {
      var iface = $('#netplanInterface').val();
      if (!iface) { $('#netplanIfaceInfo').html('<div class="text-muted" style="font-size:.8125rem">請選擇網路介面</div>'); return; }
      $.get('/netplan/interfaces/' + encodeURIComponent(iface) + '/current', function (res) {
        var html = '<div style="font-size:.8125rem"><strong>介面: </strong><code>' + escHtml(iface) + '</code></div>';
        if (res.ip_address) html += '<div style="font-size:.8125rem"><strong>IP: </strong><code>' + escHtml(res.ip_address) + '</code></div>';
        if (res.netmask_prefix) html += '<div style="font-size:.8125rem"><strong>Prefix: </strong><code>' + res.netmask_prefix + '</code></div>';
        if (!res.ip_address) html += '<div class="text-muted" style="font-size:.8125rem">無法取得目前 IP 設定</div>';
        $('#netplanIfaceInfo').html(html);
      }, 'json');
    }
    function loadNetplanHistory() {
      detectNetplanApi(function () {
        $.get(netplanUrl('/configs'), function (res) {
          if (res.code !== 0) { $('#netplanHistoryBody').html('<div class="text-danger p-2">' + res.msg + '</div>'); return; }
          var configs = res.data || [];
          if (!configs.length) { $('#netplanHistoryBody').html('<div class="text-muted p-2">尚無歷史設定</div>'); return; }
          var html = '<div class="table-responsive"><table class="table table-sm table-hover mb-0">' +
            '<thead><tr><th>#</th><th>介面</th><th>DHCP</th><th>IP</th><th>閘道</th><th>時間</th><th>操作</th></tr></thead><tbody>';
          configs.forEach(function (c) {
            var dhcpLabel = c.dhcp ? '<span class="badge bg-label-success">DHCP</span>' : '<span class="badge bg-label-info">Static</span>';
            var ip = c.dhcp ? '-' : (c.ip_address || '-') + '/' + (c.netmask_prefix || '');
            html += '<tr><td>' + c.id + '</td><td><code>' + escHtml(c.interface_name) + '</code></td><td>' + dhcpLabel + '</td><td><code>' + escHtml(ip) + '</code></td><td><code>' + escHtml(c.gateway || '-') + '</code></td><td style="font-size:.7rem">' + escHtml(c.created_at) + '</td>' +
              '<td><button class="btn btn-sm btn-outline-primary netplan-restore-config" data-id="' + c.id + '"><i class="bx bx-undo"></i></button></td></tr>';
          });
          html += '</tbody></table></div>';
          $('#netplanHistoryBody').html(html);
        });
      });
    }
    // ─── Nginx ───
    var nginxBase = null;
    var nginxBaseCandidates = ['/nginx', '/api/nginx'];
    function nginxUrl(path) { return (nginxBase || '/nginx') + path; }
    function detectNginxApi(done) {
      if (nginxBase) { if (done) done(); return; }
      var candidates = nginxBaseCandidates.slice();
      function tryNext() {
        if (!candidates.length) { nginxBase = '/nginx'; if (done) done(); return; }
        var base = candidates.shift();
        $.ajax({ url: base + '/env', dataType: 'json', method: 'GET' })
          .done(function () { nginxBase = base; if (done) done(); })
          .fail(function () { tryNext(); });
      }
      tryNext();
    }
    function loadNginxEnv() {
      detectNginxApi(function () {
        $.get(nginxUrl('/env'), function (res) {
          if (res.code !== 0) return;
          var d = res.data || {};
          $('#nginxBin').val(d.nginx_bin || 'nginx');
          $('#nginxConfigDir').val(d.config_dir || '/etc/nginx');
          $('#nginxSitesEnabledDir').val(d.sites_enabled_dir || '/etc/nginx/sites-enabled');
          $('#nginxModulesEnabledDir').val(d.modules_enabled_dir || '/etc/nginx/modules-enabled');
          $('#nginxConfDDir').val(d.conf_d_dir || '/etc/nginx/conf.d');
          logger.debug('Nginx 環境設定已載入');
        });
      });
    }
    function loadNginxSites() {
      $('#nginxSiteListBody').html('<div class="text-muted p-2">Loading...</div>');
      detectNginxApi(function () {
        $.get(nginxUrl('/sites'), function (res) {
          if (res.code !== 0) { $('#nginxSiteListBody').html('<div class="text-danger p-2">' + res.msg + '</div>'); return; }
          var sites = res.data || [];
          if (!sites.length) { $('#nginxSiteListBody').html('<div class="text-muted p-2">' + (i18n[currentLang].dashNoData || 'No data') + '</div>'); return; }
          var lang = i18n[currentLang];
          var html = '<div class="table-responsive nginx-table-wrap"><table class="table table-sm table-hover nginx-table mb-0">' +
            '<thead><tr><th>' + (lang.nginxSiteName || 'Site Name') + '</th><th>' + (lang.nginxServerName || 'Server Name') + '</th>' +
            '<th>' + (lang.nginxType || 'Type') + '</th><th>' + (lang.nginxStatus || 'Status') + '</th><th>' + (lang.nginxActions || 'Actions') + '</th></tr></thead><tbody>';
          sites.forEach(function (s) {
            var enabled = s.enabled ? '<span class="badge bg-label-success">' + (lang.nginxEnabled || 'Enabled') + '</span>' : '<span class="badge bg-label-secondary">Disabled</span>';
            var typeLabel = s.site_type === 'reverse_proxy' ? (lang.nginxReverseProxy || 'Reverse Proxy') : (lang.nginxStaticSite || 'Static Site');
            html += '<tr data-name="' + escHtml(s.site_name) + '">' +
              '<td><button type="button" class="btn btn-link p-0 text-start fw-semibold nginx-site-name-link">' + escHtml(s.site_name) + '</button></td>' +
              '<td><code>' + escHtml(s.server_name) + '</code></td>' +
              '<td>' + typeLabel + '</td>' +
              '<td>' + enabled + '</td>' +
              '<td><div class="nginx-row-actions"><button class="btn btn-sm btn-outline-primary nginx-edit-site"><i class="bx bx-edit"></i></button>' +
              '<button class="btn btn-sm btn-outline-danger nginx-delete-site"><i class="bx bx-trash"></i></button></div></td></tr>';
          });
          html += '</tbody></table></div>';
          $('#nginxSiteListBody').html(html);
          logger.debug('Nginx 網站列表已載入', sites.length + ' sites');
        });
      });
    }
    function fillNginxSiteForm(site) {
      $('#nginxEditSiteName').val(site.site_name || '');
      $('#nginxSiteName').val(site.site_name || '').prop('readonly', true);
      $('#nginxServerName').val(site.server_name || '_');
      $('#nginxListenPort').val(site.listen_port || 80);
      $('#nginxSiteType').val(site.site_type || 'server');
      $('#nginxDocRoot').val(site.document_root || '/var/www/html');
      $('#nginxProxyPass').val(site.reverse_proxy_pass || '');
      $('#nginxSiteEnabled').prop('checked', site.enabled !== false);
      updateNginxSiteEnabledLabel();
      $('#nginxSiteConfig').val(site.config_content || '');
      $('#nginxDeleteSiteBtn').show();
      toggleNginxSiteType();
    }
    function resetNginxSiteForm() {
      $('#nginxEditSiteName').val('');
      $('#nginxSiteName').val('').prop('readonly', false);
      $('#nginxServerName').val('_');
      $('#nginxListenPort').val('80');
      $('#nginxSiteType').val('server');
      $('#nginxDocRoot').val('/var/www/html');
      $('#nginxProxyPass').val('http://127.0.0.1:3000');
      $('#nginxSiteEnabled').prop('checked', true);
      updateNginxSiteEnabledLabel();
      $('#nginxSiteConfig').val('');
      $('#nginxDeleteSiteBtn').hide();
      $('#nginxSitePreviewResult').empty();
      toggleNginxSiteType();
    }
    function updateNginxSiteEnabledLabel() {
      var enabled = $('#nginxSiteEnabled').is(':checked');
      var label = enabled ? (i18n[currentLang].nginxEnabled || '啟用') : (i18n[currentLang].nginxDisabled || '停用');
      $('#nginxSiteEnabledLabel').text(label);
      $('.nginx-site-status-switch').toggleClass('is-off', !enabled);
    }
    function toggleNginxSiteType() {
      var t = $('#nginxSiteType').val();
      if (t === 'reverse_proxy') {
        $('#nginxDocRootGroup').hide();
        $('#nginxProxyPassGroup').show();
      } else {
        $('#nginxDocRootGroup').show();
        $('#nginxProxyPassGroup').hide();
      }
    }
    function loadNginxModules() {
      $('#nginxModuleListBody').html('<div class="text-muted p-2">Loading...</div>');
      detectNginxApi(function () {
        $.get(nginxUrl('/modules'), function (res) {
          if (res.code !== 0) { $('#nginxModuleListBody').html('<div class="text-danger p-2">' + res.msg + '</div>'); return; }
          var modules = res.data || [];
          if (!modules.length) { $('#nginxModuleListBody').html('<div class="text-muted p-2">' + (i18n[currentLang].dashNoData || 'No data') + '</div>'); return; }
          var lang = i18n[currentLang];
          var html = '<div class="table-responsive nginx-table-wrap"><table class="table table-sm table-hover nginx-table mb-0">' +
            '<thead><tr><th>' + (lang.nginxModuleName || 'Module Name') + '</th><th>' + (lang.nginxStatus || 'Status') + '</th><th>' + (lang.nginxActions || 'Actions') + '</th></tr></thead><tbody>';
          modules.forEach(function (m) {
            var enabled = m.enabled;
            html += '<tr><td><code>' + escHtml(m.module_name) + '</code></td>' +
              '<td><label class="form-check form-switch haproxy-status-switch' + (enabled ? '' : ' is-off') + '">' +
              '<input type="checkbox" class="form-check-input nginx-toggle-module" data-name="' + escHtml(m.module_name) + '"' + (enabled ? ' checked' : '') + '>' +
              '<span class="form-check-label">' + (enabled ? 'Enabled' : 'Disabled') + '</span></label></td>' +
              '<td></td></tr>';
          });
          html += '</tbody></table></div>';
          $('#nginxModuleListBody').html(html);
          logger.debug('Nginx 模組列表已載入', modules.length + ' modules');
        });
      });
    }
    console.log('[app.js] $ready callback executing');
