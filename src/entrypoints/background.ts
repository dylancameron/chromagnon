export default defineBackground(() => {
	// Clicking the toolbar icon opens the side panel (there's no popup).
	browser.sidePanel
		.setPanelBehavior({ openPanelOnActionClick: true })
		.catch((err) => console.error("Couldn't set side panel behavior", err));
});
