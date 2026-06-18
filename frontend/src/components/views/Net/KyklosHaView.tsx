export default function KyklosHaView() {
  return (
    <div id="kyklosHaView" style={{ display: 'none' }}>
      <ul className="nav nav-tabs nav-fill mb-3" id="kyklosHaTabs" role="tablist">
        <li className="nav-item" role="presentation">
          <button className="nav-link active" id="kyklos-ha-status-tab" data-bs-toggle="tab" data-bs-target="#kyklosHaStatusPane" type="button" role="tab">
            <i className="bx bx-pulse me-1"></i><span>Kyklos HA 狀態</span>
          </button>
        </li>
      </ul>

      <div className="tab-content p-0">
        <div className="tab-pane fade show active" id="kyklosHaStatusPane" role="tabpanel">
          <div className="card mb-3">
            <div className="card-header py-2 d-flex justify-content-between align-items-center">
              <strong style={{ fontSize: '.8125rem' }}>Kyklos HA 狀態</strong>
              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-sm btn-outline-primary" id="kyklosHaSyncBtn"><i className="bx bx-refresh me-1"></i>同步 Listener</button>
                <button className="btn btn-sm btn-outline-secondary" id="kyklosHaRefreshBtn"><i className="bx bx-refresh me-1"></i>重新整理</button>
              </div>
            </div>
            <div className="card-body" id="kyklosHaStatusBody"></div>
          </div>
          <div className="card">
            <div className="card-header py-2 d-flex justify-content-between align-items-center">
              <strong style={{ fontSize: '.8125rem' }}>已儲存 Kyklos HA 設定</strong>
              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-sm btn-primary" id="kyklosHaNewWebBtn"><i className="bx bx-plus me-1"></i>新增 Web</button>
                <button className="btn btn-sm btn-primary" id="kyklosHaNewTcpBtn"><i className="bx bx-plus me-1"></i>新增 SQL/TCP</button>
              </div>
            </div>
            <div className="card-body" id="kyklosHaSavedBody"></div>
          </div>
        </div>

        <div className="modal fade" id="kyklosHaWebModal" tabIndex={-1} aria-hidden="true">
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header py-2">
                <h5 className="modal-title" style={{ fontSize: '.875rem' }}>Web HA</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body haproxy-form kyklos-ha-form">
                <input type="hidden" id="kyklosHaWebId" />
                <div className="kyklos-ha-fields">
                  <div>
                    <label className="form-label" htmlFor="kyklosHaWebName">服務名稱</label>
                    <input type="text" className="form-control font-monospace" id="kyklosHaWebName" defaultValue="web-ha" />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="kyklosHaWebBind">Bind Address</label>
                    <input type="text" className="form-control font-monospace" id="kyklosHaWebBind" defaultValue="0.0.0.0" />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="kyklosHaWebPort">Listen Port</label>
                    <input type="number" className="form-control font-monospace" id="kyklosHaWebPort" min={1} max={65535} defaultValue={18080} />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="kyklosHaWebBalance">Balance Method</label>
                    <select className="form-select" id="kyklosHaWebBalance">
                      <option value="roundrobin">roundrobin</option>
                      <option value="leastconn">leastconn</option>
                      <option value="source">source</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label" htmlFor="kyklosHaWebHealthPath">Health Check Path</label>
                    <input type="text" className="form-control font-monospace" id="kyklosHaWebHealthPath" defaultValue="/" />
                  </div>
                  <div className="kyklos-ha-toggle-field">
                    <label className="form-label">STATUS</label>
                    <label className="form-check form-switch haproxy-status-switch">
                      <input className="form-check-input" type="checkbox" id="kyklosHaWebEnabled" defaultChecked />
                      <span className="form-check-label">啟用</span>
                    </label>
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-3 mb-2">
                  <strong style={{ fontSize: '.8125rem' }}>Backend Servers</strong>
                  <button className="btn btn-sm btn-outline-primary" id="kyklosHaWebAddServer"><i className="bx bx-plus me-1"></i>新增 Server</button>
                </div>
                <div className="table-responsive">
                  <table className="table table-sm haproxy-table kyklos-ha-table mb-0" id="kyklosHaWebServers">
                    <thead><tr><th>Name</th><th>IP</th><th>Port</th><th>Status</th><th>操作</th></tr></thead>
                    <tbody></tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">取消</button>
                <button className="btn btn-primary" id="kyklosHaWebSave"><i className="bx bx-save me-1"></i>儲存並同步</button>
              </div>
            </div>
          </div>
        </div>

        <div className="modal fade" id="kyklosHaTcpModal" tabIndex={-1} aria-hidden="true">
          <div className="modal-dialog modal-xl modal-dialog-scrollable">
            <div className="modal-content">
              <div className="modal-header py-2">
                <h5 className="modal-title" style={{ fontSize: '.875rem' }}>SQL/TCP HA</h5>
                <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
              </div>
              <div className="modal-body haproxy-form kyklos-ha-form">
                <input type="hidden" id="kyklosHaTcpId" />
                <div className="kyklos-ha-fields">
                  <div>
                    <label className="form-label" htmlFor="kyklosHaTcpName">服務名稱</label>
                    <input type="text" className="form-control font-monospace" id="kyklosHaTcpName" defaultValue="sql-ha" />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="kyklosHaTcpBind">Bind Address</label>
                    <input type="text" className="form-control font-monospace" id="kyklosHaTcpBind" defaultValue="0.0.0.0" />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="kyklosHaTcpPort">Listen Port</label>
                    <input type="number" className="form-control font-monospace" id="kyklosHaTcpPort" min={1} max={65535} defaultValue={1433} />
                  </div>
                  <div>
                    <label className="form-label" htmlFor="kyklosHaTcpBalance">Balance Method</label>
                    <select className="form-select" id="kyklosHaTcpBalance">
                      <option value="source">source</option>
                      <option value="leastconn">leastconn</option>
                      <option value="roundrobin">roundrobin</option>
                    </select>
                  </div>
                  <div className="kyklos-ha-toggle-field">
                    <label className="form-label">STATUS</label>
                    <label className="form-check form-switch haproxy-status-switch">
                      <input className="form-check-input" type="checkbox" id="kyklosHaTcpEnabled" defaultChecked />
                      <span className="form-check-label">啟用</span>
                    </label>
                  </div>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-3 mb-2">
                  <strong style={{ fontSize: '.8125rem' }}>Backend Servers</strong>
                  <button className="btn btn-sm btn-outline-primary" id="kyklosHaTcpAddServer"><i className="bx bx-plus me-1"></i>新增 Server</button>
                </div>
                <div className="table-responsive">
                  <table className="table table-sm haproxy-table kyklos-ha-table mb-0" id="kyklosHaTcpServers">
                    <thead><tr><th>Name</th><th>IP</th><th>Port</th><th>Status</th><th>操作</th></tr></thead>
                    <tbody></tbody>
                  </table>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" data-bs-dismiss="modal">取消</button>
                <button className="btn btn-primary" id="kyklosHaTcpSave"><i className="bx bx-save me-1"></i>儲存並同步</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
