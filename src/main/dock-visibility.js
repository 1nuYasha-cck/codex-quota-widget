function syncDockVisibility({ platform, dock, widgetVisible }) {
  if (platform !== "darwin" || !dock) return false;

  if (widgetVisible) dock.show();
  else dock.hide();

  return true;
}

function setDockIcon({ platform, dock, icon }) {
  if (platform !== "darwin" || !dock || !icon) return false;

  dock.setIcon(icon);
  return true;
}

module.exports = { syncDockVisibility, setDockIcon };
