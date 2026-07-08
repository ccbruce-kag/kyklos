    $(function () {
      // ─── ApiMan event handlers ───
      $(document).on('click', '#apimanCreateFirstWs,#apimanCreateWsBtn', function () {
        openApiManWorkspaceDialog();
      });
      $(document).on('click', '.apiman-del-ws', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var id = $(this).data('id');
        var wsId = $(this).closest('.apiman-ws-item').data('ws-id');
        if (!confirm('確認刪除此工作區及所有內容？')) return;
        $.ajax({ url: apimanUrl('/workspaces/' + id), type: 'DELETE', dataType: 'json' })
          .done(function (res) {
            if (res.code === 0) {
              if (String(apimanCurrentWsId || '') === String(wsId || id)) {
                apimanCurrentWsId = null;
                apimanCurrentNodeId = null;
                apimanSelectedFolderId = null;
                $('#apimanRequestCard').hide();
                $('#apimanEmptyState').show();
              }
              refreshApiManWorkspaceLists();
              showApiManNotice('工作區已刪除', '已回到工作區清單。', 'success');
            } else {
              showApiManNotice('ApiMan 刪除失敗', res.msg || 'Unknown error', 'danger');
            }
          });
      });
      $(document).on('click', '.apiman-ws-item', function () {
        var wsId = $(this).data('ws-id');
        var name = $(this).find('strong').text();
        $('#apimanCurrentWsLabel').text(name);
        renderApiManTreeForWs(wsId);
      });
      $(document).on('click', '.apiman-back-ws', function () {
        apimanCurrentWsId = null;
        apimanCurrentNodeId = null;
        apimanSelectedFolderId = null;
        renderApiManTree();
        showApiManNotice('已返回工作區清單', '可按 + 建立新工作區，或選擇既有工作區。', 'success');
      });
      $(document).on('click', '.apiman-menu-ws-link', function (e) {
        e.preventDefault();
        var wsId = $(this).data('ws-id');
        switchView('apiman');
        renderApiManTreeForWs(wsId);
      });
      // ─── ApiMan export/import ───
      $(document).on('click', '.apiman-export-ws', function () {
        var wsId = $(this).data('ws');
        $.get('/apiman/workspaces/export/' + wsId, function (res) {
          if (res.code !== 0) { layer.alert(res.msg); return; }
          var json = JSON.stringify(res.data, null, 2);
          copyText($, json);
          layer.open({
            title: '匯出工作區',
            content: '<pre class="modal-pre">' + escHtml(json.substring(0, 2000)) + (json.length > 2000 ? '\n... (已複製至剪貼簿)' : '') + '</pre>',
            btn: ['下載 JSON', '確定'],
            btn1: function () {
              var blob = new Blob([json], { type: 'application/json' });
              var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'workspace.json'; a.click();
              _hideModal();
            },
            btn2: function () { _hideModal(); }
          });
          logger.debug('ApiMan workspace exported', wsId);
        });
      });
      $(document).on('click', '#apimanImportBtn', function () {
        var input = document.createElement('input'); input.type = 'file'; input.accept = '.json';
        input.onchange = function (e) {
          var file = e.target.files[0]; if (!file) return;
          var reader = new FileReader();
          reader.onload = function (ev) {
            var data = ev.target.result;
            $.post('/apiman/workspaces/import', { data: data }, function (res) {
              if (res.code === 0) { refreshApiManWorkspaceLists(); showApiManNotice('工作區已匯入', '已更新工作區清單。', 'success'); }
              else { layer.alert(res.msg); }
            });
          };
          reader.readAsText(file);
        };
        input.click();
      });
      // ─── ApiMan Auth toggle ───
      $('#apimanAuthType').on('change', function () {
        var t = $(this).val();
        $('#apimanAuthBadge').text(t === 'none' ? 'none' : t).removeClass('bg-label-secondary bg-label-warning bg-label-info bg-label-primary')
          .addClass(t === 'none' ? 'bg-label-secondary' : 'bg-label-warning');
        $('#apimanAuthBasic,#apimanAuthBearer,#apimanAuthApiKey').hide();
        if (t === 'basic') $('#apimanAuthBasic').show();
        if (t === 'bearer') $('#apimanAuthBearer').show();
        if (t === 'apikey') $('#apimanAuthApiKey').show();
      });
      // ─── ApiMan variable event handlers ───
      $(document).on('click', '#apimanAddVar', function () {
        $('#apimanVarsList').append(
          '<div class="row g-1 mb-1 apiman-var-row">' +
          '<div class="col-1"><input type="checkbox" class="form-check-input apiman-var-enabled" checked></div>' +
          '<div class="col-4"><input type="text" class="form-control form-control-sm font-monospace apiman-var-key" placeholder="Key"></div>' +
          '<div class="col-5"><input type="text" class="form-control form-control-sm font-monospace apiman-var-value" placeholder="Value"></div>' +
          '<div class="col-2"><button class="btn btn-sm btn-outline-danger apiman-var-del"><i class="bx bx-x"></i></button></div></div>'
        );
      });
      $(document).on('click', '.apiman-var-del', function () {
        var key = $(this).data('key');
        if (key && apimanCurrentWsId) {
          $.ajax({ url: apimanUrl('/variables/' + apimanCurrentWsId + '/' + encodeURIComponent(key)), type: 'DELETE', dataType: 'json' })
            .done(function () { loadApiManVars(); });
        } else {
          $(this).closest('.apiman-var-row').remove();
        }
      });
      $('#apimanSaveVars').on('click', function () {
        if (!apimanCurrentWsId) { layer.msg('請先選擇工作區', { icon: 2 }); return; }
        var rows = $('.apiman-var-row');
        var count = 0;
        rows.each(function () {
          var key = $(this).find('.apiman-var-key').val().trim();
          if (!key) return;
          var value = $(this).find('.apiman-var-value').val();
          var enabled = $(this).find('.apiman-var-enabled').is(':checked') ? '1' : '0';
          $.ajax({
            url: apimanUrl('/variables/' + apimanCurrentWsId),
            type: 'POST',
            data: { key: key, value: value, enabled: enabled },
            dataType: 'json',
            async: false
          });
          count++;
        });
        loadApiManVars();
        layer.msg('已儲存 ' + count + ' 個變數', { icon: 1 });
        logger.debug('ApiMan 變數已儲存', count + ' vars');
      });
      // ─── ApiMan click variable hint to insert into URL ───
      $(document).on('click', '.apiman-var-insert', function () {
        var key = $(this).data('key');
        var input = document.getElementById('apimanUrl');
        var start = input.selectionStart || 0;
        var val = input.value;
        input.value = val.substring(0, start) + '{{' + key + '}}' + val.substring(input.selectionEnd || start);
        input.focus();
        var pos = start + key.length + 4;
        input.setSelectionRange(pos, pos);
      });
      // ─── ApiMan inline rename (double-click to rename folders) ───
      $(document).on('dblclick', '.apiman-folder-header .apiman-node-name', function () {
        var $item = $(this).closest('[data-node-id]');
        var nodeId = $item.data('node-id');
        var currentText = $(this).text().trim();
        var $input = $('<input type="text" class="form-control form-control-sm font-monospace" style="height:24px;font-size:.8125rem;width:140px;display:inline-block" value="' + escHtml(currentText) + '">');
        var $span = $(this);
        $input.on('blur', function () {
          var newName = $(this).val().trim();
          if (newName && newName !== currentText) {
            $.ajax({ url: '/apiman/nodes/' + nodeId, type: 'PUT', data: { name: newName }, dataType: 'json' })
              .done(function (res) { if (res.code === 0) { var wsId = $('.apiman-add-req').data('ws'); if (wsId) renderApiManTreeForWs(wsId); } });
          } else {
            $span.text(currentText);
          }
        });
        $input.on('keydown', function (e) {
          if (e.key === 'Enter') { $(this).blur(); }
          if (e.key === 'Escape') { $span.text(currentText); $(this).remove(); }
        });
        $span.empty().append($input);
        $input.focus().select();
      });
      // ─── ApiMan drag & drop ───
      $(document).on('dragstart', '.apiman-folder-header, .apiman-req-item', function (e) {
        apimanDragNodeId = $(this).closest('[data-node-id]').data('node-id');
        e.originalEvent.dataTransfer.effectAllowed = 'move';
        e.originalEvent.dataTransfer.setData('text/plain', String(apimanDragNodeId));
        $(this).closest('[data-node-id]').css('opacity', '0.4');
      });
      $(document).on('dragend', '.apiman-folder-header, .apiman-req-item', function () {
        $('[data-node-id]').css('opacity', '');
        $('.apiman-drop-zone').css({'background':'','outline':''});
        apimanDragNodeId = null;
      });
      $(document).on('dragover', '.apiman-drop-zone, .apiman-folder-header, .apiman-req-item', function (e) {
        e.preventDefault();
        e.originalEvent.dataTransfer.dropEffect = 'move';
        var $target = $(this).closest('.apiman-drop-zone').length ? $(this).closest('.apiman-drop-zone') : $(this);
        $target.css({'background':'rgba(13,110,253,0.08)','outline':'2px dashed #0d6efd'});
      });
      $(document).on('dragleave', '.apiman-drop-zone, .apiman-folder-header, .apiman-req-item', function () {
        $(this).closest('.apiman-drop-zone').css({'background':'','outline':''});
      });
      $(document).on('drop', '.apiman-drop-zone, .apiman-folder-header, .apiman-req-item', function (e) {
        e.preventDefault();
        $('.apiman-drop-zone').css({'background':'','outline':''});
        var draggedId = apimanDragNodeId;
        if (!draggedId) return;
        var newParentId = null;
        if ($(this).hasClass('apiman-folder-header')) {
          newParentId = $(this).data('node-id');
        } else {
          var $zone = $(this).closest('.apiman-drop-zone');
          newParentId = $zone.data('parent-id') || null;
        }
        if (newParentId && newParentId == draggedId) return; // Can't drop on self
        // Get workspace id from the add-req button
        var wsId = $('.apiman-add-req').data('ws');
        if (!wsId) return;
        logger.info('ApiMan 移動節點', 'node=' + draggedId + ' -> parent=' + newParentId);
        $.post('/apiman/nodes/' + draggedId + '/move', { parent_id: newParentId || '', sort_order: 0 }, function (res) {
          if (res.code === 0) { renderApiManTreeForWs(wsId); }
          else { layer.alert(res.msg); }
        });
        apimanDragNodeId = null;
      });
      $(document).on('click', '.apiman-folder-header', function (e) {
        if ($(e.target).closest('button,input,textarea,.apiman-del-node,.apiman-copy-node').length) return;
        var nodeId = $(this).data('node-id');
        if (!nodeId) return;
        apimanSelectedFolderId = nodeId;
        $('.apiman-folder-header').removeClass('is-selected');
        $(this).addClass('is-selected');
        var folderName = $(this).data('node-name') || $(this).find('.apiman-node-name').text().trim();
        $('#apimanFolderHint').html('<strong>目前位置：</strong>' + escHtml(folderName) + '。新增資料夾或 Request 會放在此資料夾底下。');
        apimanExpanded[nodeId] = !(apimanExpanded[nodeId] !== false);
        var $parent = $(this).closest('.apiman-folder-item');
        $parent.find('.apiman-children').toggleClass('d-none');
        var isOpen = !$parent.find('.apiman-children').hasClass('d-none');
        $parent.find('.apiman-fold-toggle').text(isOpen ? '▾' : '▸');
        $parent.find('.apiman-folder-icon').toggleClass('bx-folder bx-folder-open');
      });
      $(document).on('click', '.apiman-add-folder', function () {
        var wsId = $(this).data('ws');
        var name = window.prompt('資料夾名稱:');
        if (name && name.trim()) {
          var payload = { workspace_id: wsId, name: name.trim(), node_type: 'folder' };
          if (apimanSelectedFolderId) payload.parent_id = apimanSelectedFolderId;
          $.post(apimanUrl('/nodes'), payload, function (res) {
            if (res.code === 0) {
              if (apimanSelectedFolderId) apimanExpanded[apimanSelectedFolderId] = true;
              renderApiManTreeForWs(wsId);
              showApiManNotice('資料夾已新增', name.trim(), 'success');
            }
            else { showApiManNotice('新增資料夾失敗', res.msg || 'Unknown error', 'danger'); }
          });
        }
      });
      $(document).on('click', '.apiman-add-req', function () {
        var wsId = $(this).data('ws');
        var name = window.prompt('Request 名稱:');
        if (name && name.trim()) {
          var payload = { workspace_id: wsId, name: name.trim(), node_type: 'request' };
          if (apimanSelectedFolderId) payload.parent_id = apimanSelectedFolderId;
          $.post(apimanUrl('/nodes'), payload, function (res) {
            if (res.code === 0) {
              if (apimanSelectedFolderId) apimanExpanded[apimanSelectedFolderId] = true;
              renderApiManTreeForWs(wsId);
              showApiManNotice('Request 已新增', name.trim(), 'success');
            }
            else { showApiManNotice('新增 Request 失敗', res.msg || 'Unknown error', 'danger'); }
          });
        }
      });
      $(document).on('click', '#apimanNewFolder', function (e) {
        e.preventDefault();
        if (!apimanCurrentWsId) {
          showApiManNotice('請先進入工作區', '資料夾必須建立在某個工作區內。', 'warning');
          return;
        }
        $('.apiman-add-folder').first().trigger('click');
      });
      $(document).on('click', '#apimanNewRequest', function (e) {
        e.preventDefault();
        if (!apimanCurrentWsId) {
          showApiManNotice('請先進入工作區', 'Request 必須建立在某個工作區內。', 'warning');
          return;
        }
        $('.apiman-add-req').first().trigger('click');
      });
      $(document).on('click', '.apiman-req-item', function () {
        var nodeId = $(this).data('node-id');
        apimanCurrentNodeId = nodeId;
        $('.apiman-req-item').removeClass('is-active');
        $(this).addClass('is-active');
        loadApiManRequest(nodeId);
      });
      $(document).on('click', '.apiman-copy-node', function (e) {
        e.stopPropagation();
        var id = $(this).data('id');
        $.post(apimanUrl('/nodes/' + id + '/copy'), {}, function (res) {
          if (res.code === 0) {
            var wsId = $('.apiman-add-req').data('ws');
            if (wsId) renderApiManTreeForWs(wsId);
            showApiManNotice('ApiMan 節點已複製', '已新增一份副本。', 'success');
          } else { showApiManNotice('複製失敗', res.msg || 'Unknown error', 'danger'); }
        });
      });
      $(document).on('click', '.apiman-del-node', function (e) {
        e.stopPropagation();
        var id = $(this).data('id');
        var isFolder = $(this).closest('.apiman-folder-item').length > 0 && $(this).closest('.apiman-folder-header').length === 0
          ? false
          : $(this).closest('.apiman-folder-header').length > 0 || $(this).closest('.apiman-folder-item').children('.apiman-folder-header').find('.apiman-del-node[data-id="' + id + '"]').length > 0;
        var label = isFolder ? '資料夾' : 'Request';
        if (!confirm('確認刪除？')) return;
        $.ajax({ url: apimanUrl('/nodes/' + id), type: 'DELETE', dataType: 'json' })
          .done(function (res) {
            if (res.code === 0) {
              apimanCurrentNodeId = null;
              if (String(apimanSelectedFolderId || '') === String(id)) apimanSelectedFolderId = null;
              $('#apimanRequestCard').hide();
              $('#apimanEmptyState').show();
              renderApiManTreeForWs($('.apiman-add-req').data('ws'));
              showApiManNotice(label + '已刪除', '已清除目前選取狀態。', 'success');
            } else {
              showApiManNotice('刪除失敗', res.msg || 'Unknown error', 'danger');
            }
          });
      });
      $(document).on('click', '#apimanAddParam', function () { addApiManKvRow('#apimanParamsList', 'apimanParam'); });
      $(document).on('click', '#apimanAddHeader', function () { addApiManKvRow('#apimanHeadersList', 'apimanHeader'); });
      function addApiManKvRow(containerId, prefix) {
        $(containerId).append(
          '<div class="row g-1 mb-1 apiman-kv-row">' +
          '<div class="col-1"><input type="checkbox" class="form-check-input apiman-kv-enabled" checked></div>' +
          '<div class="col-4"><input type="text" class="form-control form-control-sm font-monospace apiman-kv-key" placeholder="Key"></div>' +
          '<div class="col-5"><input type="text" class="form-control form-control-sm font-monospace apiman-kv-value" placeholder="Value"></div>' +
          '<div class="col-2"><button class="btn btn-sm btn-outline-danger apiman-kv-del"><i class="bx bx-x"></i></button></div></div>'
        );
      }
      $(document).on('click', '.apiman-kv-del', function () { $(this).closest('.apiman-kv-row').remove(); });
      $('#apimanHistoryBtn').on('click', function () {
        if (apimanCurrentNodeId) loadApiManHistory(apimanCurrentNodeId);
        else showApiManNotice('請先選擇 Request', '選取 Request 後才能查看歷史紀錄。', 'warning');
      });
      $(document).on('click', '.apiman-view-history', function () {
        try {
          var raw = $(this).attr('data-body');
          var cached = $(this).data('body');
          var data = null;
          if (raw) {
            data = JSON.parse(decodeURIComponent(raw));
          } else if (typeof cached === 'string') {
            data = JSON.parse(cached);
          } else {
            data = cached;
          }
          if (!data || typeof data !== 'object') throw new Error('history response payload is empty');
          var html = '<div class="mb-1"><strong>Status:</strong> ' + data.status + '</div>' +
            (data.headers ? '<div class="mb-1"><strong>Headers:</strong><pre style="font-size:.7rem;max-height:150px;overflow:auto">' + escHtml(data.headers) + '</pre></div>' : '') +
            (data.body ? '<div><strong>Body:</strong><pre style="font-size:.7rem;max-height:300px;overflow:auto">' + escHtml(data.body) + '</pre></div>' : '');
          showApiManNotice('Response 已開啟', 'Status: ' + (data.status || '?'), 'success');
          layer.open({ title: 'Response #' + data.id, content: html, area: ['700px', '70vh'], btn: ['OK'] });
        } catch(e) { showApiManNotice('Response 載入失敗', String(e), 'danger'); }
      });
      $('#apimanSaveReqBtn').on('click', function () {
        var nodeId = apimanCurrentNodeId;
        if (!nodeId) return;
        var data = {
          method: $('#apimanMethod').val(),
          url: $('#apimanUrl').val().trim(),
          query_params: collectApiManKv('apimanParam'),
          headers: collectApiManKv('apimanHeader'),
          body_type: $('#apimanBodyType').val(),
          body_content: $('#apimanBody').val(),
          auth_config: collectApiManAuth()
        };
        logger.info('儲存 ApiMan Request', data.method + ' ' + data.url);
        $.ajax({ url: apimanUrl('/requests/' + nodeId), type: 'PUT', data: data, dataType: 'json' })
          .done(function (res) {
            if (res.code === 0) {
              updateApiManRequestTreeItem(nodeId, data.method, data.url);
              showApiManNotice('Request 已儲存', data.method + ' ' + (data.url || '尚未設定 URL'), 'success');
            } else {
              showApiManNotice('Request 儲存失敗', res.msg || 'Unknown error', 'danger');
            }
          });
      });
      $('#apimanSendBtn').on('click', function () {
        var nodeId = apimanCurrentNodeId;
        if (!nodeId) return;
        var data = {
          method: $('#apimanMethod').val(),
          url: $('#apimanUrl').val().trim(),
          query_params: collectApiManKv('apimanParam'),
          headers: collectApiManKv('apimanHeader'),
          body_type: $('#apimanBodyType').val(),
          body_content: $('#apimanBody').val(),
          auth_config: collectApiManAuth()
        };
        // Save first, then send
        $.ajax({ url: apimanUrl('/requests/' + nodeId), type: 'PUT', data: data, dataType: 'json' })
          .done(function (saveRes) {
            if (saveRes && saveRes.code !== 0) {
              showApiManNotice('Request 儲存失敗', saveRes.msg || 'Unknown error', 'danger');
              return;
            }
            updateApiManRequestTreeItem(nodeId, data.method, data.url);
            logger.info('送出 ApiMan Request', data.method + ' ' + data.url);
            $('#apimanResponse').html('<div class="text-muted">發送中...</div>');
            $.post(apimanUrl('/requests/' + nodeId + '/send'), {}, function (res) {
              if (res.code !== 0) {
                $('#apimanResponse').html('<pre class="text-danger p-2" style="font-size:.75rem">' + escHtml(res.msg) + '</pre>');
                showApiManNotice('Request 測試失敗', res.msg || 'Unknown error', 'danger');
                return;
              }
              var r = res.data;
              var statusCls = r.status >= 200 && r.status < 300 ? 'text-success' : r.status >= 400 ? 'text-danger' : 'text-warning';
              var html = '<div class="border rounded p-2 mt-2" style="font-size:.75rem;background:var(--bs-tertiary-bg)">' +
                '<div class="mb-1"><strong>Status: </strong><span class="' + statusCls + ' fw-bold">' + (r.status || '?') + '</span></div>' +
                (r.headers ? '<div class="mb-1"><strong>Headers:</strong><pre style="font-size:.6875rem;max-height:150px;overflow:auto">' + escHtml(r.headers) + '</pre></div>' : '') +
                (r.body ? '<div><strong>Body:</strong><pre style="font-size:.6875rem;max-height:300px;overflow:auto">' + escHtml(r.body) + '</pre></div>' : '') +
                '</div>';
              $('#apimanResponse').html(html);
              showApiManNotice('Request 測試完成', 'Status: ' + (r.status || '?'), r.status >= 200 && r.status < 400 ? 'success' : 'warning');
              logger.debug('ApiMan Response', 'Status=' + r.status);
            });
          });
      });
    });
