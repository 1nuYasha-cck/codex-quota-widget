function syncDockVisibility({ platform, dock, widgetVisible }) {
  if (platform !== "darwin" || !dock) return false;

  if (widgetVisible) dock.show();
  else dock.hide();

  return true;
}

module.exports = { syncDockVisibility };
