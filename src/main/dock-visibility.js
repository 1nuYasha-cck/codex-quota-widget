function syncDockVisibility({ platform, dock, widgetVisible }) {
  if (platform !== "darwin" || !dock) return false;

  const isVisible = typeof dock.isVisible === "function" ? dock.isVisible() : null;

  if (widgetVisible && isVisible !== true) dock.show();
  else if (!widgetVisible && isVisible !== false) dock.hide();

  return true;
}

module.exports = { syncDockVisibility };
