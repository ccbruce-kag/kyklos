    $(function () {
      // ─── Netplan event handlers ───
      $('#netplanDhcp').on('change', function () {
        if ($(this).is(':checked')) {
          $('#netplanStaticFields input').prop('disabled', true);
          $('#netplanStaticFields').css('opacity', 0.5);
        } else {
          $('#netplanStaticFields input').prop('disabled', false);
          $('#netplanStaticFields').css('opacity', 1);
        }
      });
      $('#netplanRefreshIfaces').on('click', loadNetplanInterfaces);
      $('#netplanInterface').on('change', loadNetplanIfaceInfo);
      $('#netplanPreviewBtn').on('click', function () {
        var data = {
          interface_name: $('#netplanInterface').val(),
          dhcp: $('#netplanDhcp').is(':checked') ? '1' : '0',
          ip_address: $('#netplanIpAddress').val().trim(),
          netmask_prefix: $('#netplanPrefix').val(),
          gateway: $('#netplanGateway').val().trim(),
          dns_servers: $('#netplanDns').val().trim()
        };
        if (!data.interface_name) { layer.msg('請選擇網路介面', { icon: 2 }); return; }
        $.post('/netplan/preview', data, function (res) {
          if (res.code !== 0) { layer.alert(res.msg); return; }
          $('#netplanYaml').val(res.data.config || '');
          logger.debug('Netplan YAML 已產生');
        });
      });
      $('#netplanApplyBtn').on('click', function () {
        var data = {
          interface_name: $('#netplanInterface').val(),
          dhcp: $('#netplanDhcp').is(':checked') ? '1' : '0',
          ip_address: $('#netplanIpAddress').val().trim(),
          netmask_prefix: $('#netplanPrefix').val(),
          gateway: $('#netplanGateway').val().trim(),
          dns_servers: $('#netplanDns').val().trim(),
          config_yaml: $('#netplanYaml').val().trim()
        };
        if (!data.interface_name) { layer.msg('請選擇網路介面', { icon: 2 }); return; }
        if (!data.config_yaml) { layer.msg('請先產生 YAML 設定', { icon: 2 }); return; }
        logger.info('套用 Netplan 設定', data.interface_name);
        $('#netplanResult').html('<div class="text-muted">套用中...</div>');
        $.post('/netplan/apply', data, function (res) {
          if (res.code !== 0) { $('#netplanResult').html('<div class="text-danger p-2" style="font-size:.8125rem">' + escHtml(res.msg) + '</div>'); return; }
          $('#netplanResult').html('<pre class="text-success" style="font-size:.75rem;background:var(--bs-tertiary-bg);padding:.5rem;border-radius:4px">' + escHtml(res.data.output || '套用成功') + '</pre>');
          logger.debug('Netplan 已套用');
          loadNetplanHistory();
        }, 'json');
      });
      $('#netplanRefreshHistory').on('click', loadNetplanHistory);
      $(document).on('click', '.netplan-restore-config', function () {
        var id = $(this).data('id');
        if (!id) return;
        detectNetplanApi(function () {
          $.get(netplanUrl('/configs'), function (res) {
            if (res.code !== 0) return;
            var configs = res.data || [];
            var cfg = configs.find(function (c) { return c.id === id; });
            if (!cfg) { layer.msg('找不到該設定', { icon: 2 }); return; }
            $('#netplanInterface').val(cfg.interface_name);
            $('#netplanDhcp').prop('checked', !!cfg.dhcp).trigger('change');
            $('#netplanIpAddress').val(cfg.ip_address || '');
            $('#netplanPrefix').val(cfg.netmask_prefix || 24);
            $('#netplanGateway').val(cfg.gateway || '');
            $('#netplanDns').val(cfg.dns_servers || '');
            $('#netplanYaml').val(cfg.config_yaml || '');
            $('#netplanConfigTabLabel').click();
            layer.msg('已載入歷史設定', { icon: 1 });
          });
        });
      });
      $(document).on('shown.bs.tab', '#netplanTabs .nav-link', function () {
        if ($(this).attr('data-bs-target') === '#netplanHistoryPane') loadNetplanHistory();
      });
      // ─── Nginx event handlers ───
      $('#nginxSiteType').on('change', toggleNginxSiteType);
      $('#nginxSaveEnvBtn').on('click', function () {
        var data = {
          nginx_bin: $('#nginxBin').val().trim(),
          config_dir: $('#nginxConfigDir').val().trim(),
          sites_enabled_dir: $('#nginxSitesEnabledDir').val().trim(),
          modules_enabled_dir: $('#nginxModulesEnabledDir').val().trim(),
          conf_d_dir: $('#nginxConfDDir').val().trim()
        };
        logger.info('儲存 Nginx 環境設定');
        detectNginxApi(function () {
          $.post(nginxUrl('/env'), data, function (res) {
            if (res.code !== 0) { layer.alert(res.msg); return; }
            showNginxToast(i18n[currentLang].nginxEnvSaved || '環境設定已儲存', 'Nginx 環境路徑已更新。', data.nginx_bin + ' · ' + data.config_dir, 'bx-save');
            logger.debug('Nginx 環境設定已儲存');
          });
        });
      });
      $('#nginxTestBtn').on('click', function () {
        logger.info('測試 Nginx 設定');
        $('#nginxEnvResult').html('<div class="text-muted">Testing...</div>');
        detectNginxApi(function () {
          $.post(nginxUrl('/test'), {}, function (res) {
            var output = res.data || res.msg || 'No output';
            var cls = res.code === 0 ? 'text-success' : 'text-danger';
            $('#nginxEnvResult').html('<pre class="' + cls + '" style="font-size:.75rem;background:var(--bs-tertiary-bg);padding:.5rem;border-radius:4px">' + escHtml(output) + '</pre>');
            logger.debug('Nginx 設定測試結果', output);
          });
        });
      });
      $('#nginxReloadBtn').on('click', function () {
        logger.info('重新載入 Nginx');
        $('#nginxEnvResult').html('<div class="text-muted">Reloading...</div>');
        detectNginxApi(function () {
          $.post(nginxUrl('/reload'), {}, function (res) {
            var output = res.data || res.msg || 'No output';
            var cls = res.code === 0 ? 'text-success' : 'text-danger';
            $('#nginxEnvResult').html('<pre class="' + cls + '" style="font-size:.75rem;background:var(--bs-tertiary-bg);padding:.5rem;border-radius:4px">' + escHtml(output) + '</pre>');
            logger.debug('Nginx 重新載入結果', output);
          });
        });
      });
      function showNginxToast(title, message, detail, icon, className) {
        var opts = {
          important: true,
          toast: true,
          message: message || '',
          detail: detail || '',
          iconClass: icon || 'bx-check-circle',
          time: 6500,
          className: 'nginx-toast' + (className ? ' ' + className : '')
        };
        layer.msg(title, opts);
      }
      function runNginxServiceAction(action, label) {
        logger.info(label + ' Nginx');
        $('#nginxEnvResult').html('<div class="text-muted">' + escHtml(label) + '...</div>');
        detectNginxApi(function () {
          $.post(nginxUrl('/' + action), {}, function (res) {
            var output = res.data || res.msg || 'No output';
            var cls = res.code === 0 ? 'text-success' : 'text-danger';
            $('#nginxEnvResult').html('<pre class="' + cls + '" style="font-size:.75rem;background:var(--bs-tertiary-bg);padding:.5rem;border-radius:4px">' + escHtml(output) + '</pre>');
            if (res.code === 0) showNginxToast('Nginx ' + label + '完成', '服務指令已執行。', output, action === 'stop' ? 'bx-stop-circle' : 'bx-check-circle', action === 'stop' ? 'is-disabled' : '');
            else layer.alert(output);
            logger.debug('Nginx ' + label + '結果', output);
          }).fail(function (xhr) {
            var msg = xhr.responseText || xhr.statusText || 'Request failed';
            $('#nginxEnvResult').html('<pre class="text-danger" style="font-size:.75rem;background:var(--bs-tertiary-bg);padding:.5rem;border-radius:4px">' + escHtml(msg) + '</pre>');
            layer.alert(msg);
          });
        });
      }
      $('#nginxStartBtn').on('click', function () { runNginxServiceAction('start', i18n[currentLang].nginxStart || '啟動'); });
      $('#nginxStopBtn').on('click', function () { runNginxServiceAction('stop', i18n[currentLang].nginxStop || '停止'); });
      $('#nginxRestartBtn').on('click', function () { runNginxServiceAction('restart', i18n[currentLang].nginxRestart || '重啟'); });
      $('#nginxSiteEnabled').on('change', function () {
        var enabled = $(this).is(':checked');
        var label = enabled ? (i18n[currentLang].nginxEnabled || '啟用') : (i18n[currentLang].nginxDisabled || '停用');
        $('#nginxSiteEnabledLabel').text(label);
        $('.nginx-site-status-switch').toggleClass('is-off', !enabled);
      });
      $('#nginxSaveSiteBtn').on('click', function () {
        var editName = $('#nginxEditSiteName').val();
        var isEdit = !!editName;
        var data = {
          site_name: $('#nginxSiteName').val().trim(),
          server_name: $('#nginxServerName').val().trim(),
          listen_port: $('#nginxListenPort').val().trim(),
          site_type: $('#nginxSiteType').val(),
          document_root: $('#nginxDocRoot').val().trim(),
          reverse_proxy_pass: $('#nginxProxyPass').val().trim(),
          enabled: $('#nginxSiteEnabled').is(':checked') ? '1' : '0',
          config_content: $('#nginxSiteConfig').val().trim() || null
        };
        if (!data.site_name) { layer.msg('Site name required', { icon: 2 }); return; }
        var listenPort = parseInt(data.listen_port, 10);
        if (!listenPort || listenPort < 1 || listenPort > 65535) {
          layer.alert('Listen Port must be between 1 and 65535');
          return;
        }
        logger.info((isEdit ? '更新' : '新增') + ' Nginx 網站', data.site_name);
        detectNginxApi(function () {
          if (isEdit) {
            $.post(nginxUrl('/sites/' + encodeURIComponent(editName)), data, function (res) {
              if (res.code !== 0) { layer.alert(res.msg); return; }
              showNginxToast(i18n[currentLang].nginxSiteUpdated || '網站已更新', '網站資料已儲存至資料庫。', data.site_name, 'bx-save');
              loadNginxSites();
            });
          } else {
            $.post(nginxUrl('/sites'), data, function (res) {
              if (res.code !== 0) { layer.alert(res.msg); return; }
              showNginxToast(i18n[currentLang].nginxSiteAdded || '網站已新增', '網站資料已儲存至資料庫。', data.site_name, 'bx-plus-circle');
              loadNginxSites();
              fillNginxSiteForm(res.data);
            });
          }
        });
      });
      function currentNginxSiteName() {
        return ($('#nginxEditSiteName').val() || $('#nginxSiteName').val() || '').trim();
      }
      function renderNginxSiteActionResult(ok, title, output) {
        var cls = ok ? 'text-success' : 'text-danger';
        $('#nginxSitePreviewResult').html(
          '<pre class="' + cls + '" style="font-size:.75rem;background:var(--bs-tertiary-bg);padding:.5rem;border-radius:4px;max-height:260px;overflow:auto">' +
          escHtml(title + '\n' + (output || 'No output')) +
          '</pre>'
        );
      }
      function testAndReloadNginxAfterSiteAction(name, actionTitle, toastTitle, toastMessage, icon, done) {
        $('#nginxSitePreviewResult').html('<div class="text-muted">Testing nginx config...</div>');
        $.post(nginxUrl('/test'), {}, function (testRes) {
          var testOutput = testRes.data || testRes.msg || 'No output';
          if (testRes.code !== 0) {
            renderNginxSiteActionResult(false, actionTitle + '，但測試設定失敗', testOutput);
            layer.alert(testOutput);
            if (done) done(false);
            return;
          }
          $('#nginxSitePreviewResult').html('<div class="text-muted">Reloading nginx...</div>');
          $.post(nginxUrl('/reload'), {}, function (reloadRes) {
            var reloadOutput = reloadRes.data || reloadRes.msg || 'No output';
            var ok = reloadRes.code === 0;
            renderNginxSiteActionResult(ok, ok ? actionTitle + '並 Reload 完成' : actionTitle + '完成，但 Reload 失敗', 'nginx -t:\n' + testOutput + '\n\nreload:\n' + reloadOutput);
            if (ok) showNginxToast(toastTitle, toastMessage, name, icon || 'bx-check-double', 'is-disabled');
            else layer.alert(reloadOutput);
            if (done) done(ok);
          });
        });
      }
      $('#nginxWriteSiteBtn').on('click', function () {
        var name = currentNginxSiteName();
        if (!name) { layer.msg('Site name required', { icon: 2 }); return; }
        logger.info('寫入 Nginx 網站設定檔', name);
        detectNginxApi(function () {
          $.post(nginxUrl('/sites/' + encodeURIComponent(name) + '/write'), { write_file: '1' }, function (res) {
            if (res.code !== 0) { renderNginxSiteActionResult(false, '寫入設定檔失敗', res.msg); layer.alert(res.msg); return; }
            renderNginxSiteActionResult(true, '寫入設定檔完成', res.data && res.data.config ? res.data.config : '');
            showNginxToast(i18n[currentLang].nginxSiteFileWritten || '設定檔已寫入', '已寫入 sites-enabled。', name, 'bx-file-plus');
          });
        });
      });
      $('#nginxRemoveSiteFileBtn').on('click', function () {
        var name = currentNginxSiteName();
        if (!name) { layer.msg('Site name required', { icon: 2 }); return; }
        if (!confirm(i18n[currentLang].nginxConfirmDeleteFile || 'Confirm delete file from sites-enabled?')) return;
        logger.info('移除 Nginx 網站設定檔', name);
        detectNginxApi(function () {
          $('#nginxSitePreviewResult').html('<div class="text-muted">Removing site config...</div>');
          $.ajax({ url: nginxUrl('/sites/' + encodeURIComponent(name) + '/file'), type: 'DELETE', dataType: 'json' })
            .done(function (res) {
              if (res.code !== 0) { renderNginxSiteActionResult(false, '移除設定檔失敗', res.msg); layer.alert(res.msg); return; }
              testAndReloadNginxAfterSiteAction(name, '移除設定檔', i18n[currentLang].nginxSiteFileRemoved || '設定檔已移除', '已從 sites-enabled 移除並重新載入 Nginx。', 'bx-file-blank');
            });
        });
      });
      $('#nginxWriteTestReloadBtn').on('click', function () {
        var name = currentNginxSiteName();
        if (!name) { layer.msg('Site name required', { icon: 2 }); return; }
        var enabled = $('#nginxSiteEnabled').is(':checked');
        logger.info('Nginx 寫入後測試並 Reload', name);
        $('#nginxSitePreviewResult').html('<div class="text-muted">' + (enabled ? 'Writing site config...' : 'Removing disabled site config...') + '</div>');
        detectNginxApi(function () {
          var prepare = enabled
            ? $.post(nginxUrl('/sites/' + encodeURIComponent(name) + '/write'), { write_file: '1' })
            : $.ajax({ url: nginxUrl('/sites/' + encodeURIComponent(name) + '/file'), type: 'DELETE', dataType: 'json' });
          prepare.done(function (writeRes) {
            if (writeRes.code !== 0) { renderNginxSiteActionResult(false, enabled ? '寫入設定檔失敗' : '移除設定檔失敗', writeRes.msg); layer.alert(writeRes.msg); return; }
            $('#nginxSitePreviewResult').html('<div class="text-muted">Testing nginx config...</div>');
            $.post(nginxUrl('/test'), {}, function (testRes) {
              var testOutput = testRes.data || testRes.msg || 'No output';
              if (testRes.code !== 0) { renderNginxSiteActionResult(false, '測試設定失敗', testOutput); layer.alert(testOutput); return; }
              $('#nginxSitePreviewResult').html('<div class="text-muted">Reloading nginx...</div>');
              $.post(nginxUrl('/reload'), {}, function (reloadRes) {
                var reloadOutput = reloadRes.data || reloadRes.msg || 'No output';
                var ok = reloadRes.code === 0;
                var doneTitle = enabled ? '寫入、測試、Reload 完成' : '移除、測試、Reload 完成';
                var failTitle = enabled ? '寫入與測試完成，但 Reload 失敗' : '移除與測試完成，但 Reload 失敗';
                renderNginxSiteActionResult(ok, ok ? doneTitle : failTitle, (enabled ? 'write' : 'remove') + ':\n' + name + '\n\nnginx -t:\n' + testOutput + '\n\nreload:\n' + reloadOutput);
                if (ok) showNginxToast(enabled ? (i18n[currentLang].nginxWriteTestReloadDone || doneTitle) : '移除、測試、Reload 完成', enabled ? '設定已寫入並重新載入 Nginx。' : '停用網站設定檔已移除並重新載入 Nginx。', name, enabled ? 'bx-check-double' : 'bx-file-blank', enabled ? '' : 'is-disabled');
                else layer.alert(reloadOutput);
              });
            });
          });
        });
      });
      $('#nginxPreviewSiteBtn').on('click', function () {
        var name = $('#nginxSiteName').val().trim();
        if (!name) { layer.msg('Site name required', { icon: 2 }); return; }
        detectNginxApi(function () {
          $.get(nginxUrl('/sites/' + encodeURIComponent(name) + '/preview'), function (res) {
            if (res.code !== 0) { layer.alert(res.msg); return; }
            $('#nginxSitePreviewResult').html('<pre class="haproxy-preview" style="max-height:200px">' + escHtml(res.data.config) + '</pre>');
          });
        });
      });
      $('#nginxDeleteSiteBtn').on('click', function () {
        var name = $('#nginxEditSiteName').val();
        if (!name) return;
        if (!confirm(i18n[currentLang].nginxConfirmDelete || 'Confirm delete this site?')) return;
        logger.info('刪除 Nginx 網站', name);
        detectNginxApi(function () {
          $.ajax({ url: nginxUrl('/sites/' + encodeURIComponent(name)), type: 'DELETE', dataType: 'json' })
            .done(function (res) {
              if (res.code !== 0) { layer.alert(res.msg); return; }
              testAndReloadNginxAfterSiteAction(name, '刪除網站', i18n[currentLang].nginxSiteDeleted || '網站已刪除', '網站資料與設定檔已移除並重新載入 Nginx。', 'bx-trash', function () {
                resetNginxSiteForm();
                loadNginxSites();
              });
            });
        });
      });
      $('#nginxRefreshSites').on('click', function () { loadNginxSites(); });
      function loadNginxSiteIntoForm(name) {
        if (!name) return;
        logger.info('載入 Nginx 網站設定', name);
        detectNginxApi(function () {
          $.get(nginxUrl('/sites/' + encodeURIComponent(name)), function (res) {
            if (res.code !== 0) { layer.alert(res.msg); return; }
            fillNginxSiteForm(res.data);
            showNginxToast('已載入 Nginx 網站設定', '網站設定已載入到左側表單。', name, 'bx-edit');
          });
        });
      }
      $(document).on('click', '.nginx-edit-site, .nginx-site-name-link', function () {
        var name = $(this).closest('tr').data('name');
        loadNginxSiteIntoForm(name);
      });
      $(document).on('click', '.nginx-delete-site', function () {
        var name = $(this).closest('tr').data('name');
        if (!name) return;
        if (!confirm(i18n[currentLang].nginxConfirmDelete || 'Confirm delete this site?')) return;
        logger.info('刪除 Nginx 網站', name);
        detectNginxApi(function () {
          $.ajax({ url: nginxUrl('/sites/' + encodeURIComponent(name)), type: 'DELETE', dataType: 'json' })
            .done(function (res) {
              if (res.code !== 0) { layer.alert(res.msg); return; }
              testAndReloadNginxAfterSiteAction(name, '刪除網站', i18n[currentLang].nginxSiteDeleted || '網站已刪除', '網站資料與設定檔已移除並重新載入 Nginx。', 'bx-trash', function () {
                loadNginxSites();
              });
            });
        });
      });
      $('#nginxAddModuleBtn').on('click', function () {
        var name = $('#nginxModuleName').val().trim();
        if (!name) { layer.msg('Module name required', { icon: 2 }); return; }
        logger.info('新增 Nginx 模組', name);
        detectNginxApi(function () {
          $.post(nginxUrl('/modules'), { module_name: name }, function (res) {
            if (res.code !== 0) { layer.alert(res.msg); return; }
            showNginxToast(i18n[currentLang].nginxModuleAdded || '模組已新增', '模組資料已新增。', name, 'bx-puzzle');
            $('#nginxModuleName').val('');
            loadNginxModules();
          });
        });
      });
      $(document).on('change', '.nginx-toggle-module', function () {
        var input = $(this);
        var name = input.data('name');
        var enabled = input.is(':checked');
        logger.info('切換 Nginx 模組狀態', name + '=' + enabled);
        detectNginxApi(function () {
          $.post(nginxUrl('/modules/' + encodeURIComponent(name) + '/enabled'), { enabled: enabled ? '1' : '0' }, function (res) {
            if (res.code !== 0) { input.prop('checked', !enabled); layer.alert(res.msg); return; }
            showNginxToast(i18n[currentLang].nginxModuleToggled || '模組狀態已切換', enabled ? '模組已啟用。' : '模組已停用。', name, enabled ? 'bx-check-circle' : 'bx-pause-circle', enabled ? '' : 'is-disabled');
            loadNginxModules();
          });
        });
      });
      $('#nginxRefreshModules').on('click', function () { loadNginxModules(); });
      $('#nginxScanModulesBtn').on('click', function () {
        logger.info('掃描系統 Nginx 模組');
        $('#nginxScanModulesResult').html('<div class="text-muted">Scanning...</div>');
        detectNginxApi(function () {
          $.get(nginxUrl('/modules/scan'), function (res) {
            if (res.code !== 0) { $('#nginxScanModulesResult').html('<div class="text-danger">' + escHtml(res.msg) + '</div>'); return; }
            var modules = res.data || [];
            if (!modules.length) { $('#nginxScanModulesResult').html('<div class="text-muted">' + (i18n[currentLang].dashNoData || 'No modules found') + '</div>'); return; }
            var html = '<div style="display:flex;flex-wrap:wrap;gap:.25rem">';
            modules.forEach(function (m) {
              html += '<span class="juniper-chip" style="cursor:pointer" data-name="' + escHtml(m) + '">' + escHtml(m) + '</span>';
            });
            html += '</div>';
            $('#nginxScanModulesResult').html(html);
            logger.debug('掃描到 ' + modules.length + ' 個系統模組');
          });
        });
      });
      $(document).on('click', '#nginxScanModulesResult .juniper-chip', function () {
        var name = $(this).data('name');
        if (name) $('#nginxModuleName').val(name);
      });
    });
