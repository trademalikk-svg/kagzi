(function () {
  'use strict';

  function bindPanelToggle(root, buttonId, panelId, expandedLabel, collapsedLabel, expandedAriaLabel, collapsedAriaLabel) {
    const button = root.getElementById(buttonId);
    const panel = root.getElementById(panelId);
    if (!button || !panel || typeof button.addEventListener !== 'function') return;

    const initialExpanded = button.getAttribute('aria-expanded') !== 'false';
    button.setAttribute('aria-expanded', String(initialExpanded));
    button.textContent = initialExpanded ? expandedLabel : collapsedLabel;
    button.setAttribute('aria-label', initialExpanded ? expandedAriaLabel : collapsedAriaLabel);
    panel.classList.toggle('is-collapsed', !initialExpanded);

    button.addEventListener('click', function () {
      const currentlyExpanded = button.getAttribute('aria-expanded') === 'true';
      const nextExpanded = !currentlyExpanded;
      button.setAttribute('aria-expanded', String(nextExpanded));
      button.textContent = nextExpanded ? expandedLabel : collapsedLabel;
      button.setAttribute('aria-label', nextExpanded ? expandedAriaLabel : collapsedAriaLabel);
      panel.classList.toggle('is-collapsed', !nextExpanded);
    });
  }

  function init(root) {
    const doc = root || document;
    bindPanelToggle(doc, 'togglePageRail', 'pdfPageRailPanel', 'Hide pages', 'Show pages', 'Hide page thumbnails', 'Show page thumbnails');
    bindPanelToggle(doc, 'toggleInspector', 'pdfSelectionProperties', 'Hide properties', 'Show properties', 'Hide properties panel', 'Show properties panel');
    const query = typeof doc.querySelector === 'function' ? doc.querySelector.bind(doc) : () => null;
    const workspace = query('.editor-workspace');
    const inspector = doc.getElementById('pdfInspector');
    const shell = query('.editor-shell');
    const toolbar = query('.editor-toolbar');
    if (workspace && inspector && shell && toolbar) {
      const placeInspector = () => {
        if (window.matchMedia('(max-width: 650px)').matches) {
          if (inspector.parentElement !== shell) shell.insertBefore(inspector, workspace);
        } else if (inspector.parentElement !== workspace) {
          workspace.appendChild(inspector);
        }
      };
      placeInspector();
      window.addEventListener('resize', placeInspector, { passive: true });
    }
  }

  window.KAGZIPdfWorkspace = { init };
})();
