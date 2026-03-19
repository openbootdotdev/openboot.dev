export interface MacOSPrefCatalogItem {
	id: string;
	category: string;
	label: string;
	description: string;
	domain: string;
	key: string;
	type: 'bool' | 'int' | 'float' | 'string';
	defaultValue: string;
	options?: { value: string; label: string }[];
	min?: number;
	max?: number;
}

export const MACOS_PREF_CATALOG: MacOSPrefCatalogItem[] = [
	// Dock
	{ id: 'dock-autohide', category: 'Dock', label: 'Auto-hide Dock', description: 'Automatically hide and show the Dock when not in use', domain: 'com.apple.dock', key: 'autohide', type: 'bool', defaultValue: 'true' },
	{ id: 'dock-autohide-delay', category: 'Dock', label: 'Auto-hide delay (s)', description: 'Delay before the Dock appears when hovering — 0 for instant', domain: 'com.apple.dock', key: 'autohide-delay', type: 'float', defaultValue: '0', min: 0, max: 5 },
	{ id: 'dock-tilesize', category: 'Dock', label: 'Icon size', description: 'Size of Dock icons in pixels', domain: 'com.apple.dock', key: 'tilesize', type: 'int', defaultValue: '48', min: 16, max: 128 },
	{ id: 'dock-show-recents', category: 'Dock', label: 'Show recent apps', description: 'Show recently used apps in a separate section of the Dock', domain: 'com.apple.dock', key: 'show-recents', type: 'bool', defaultValue: 'false' },
	{ id: 'dock-orientation', category: 'Dock', label: 'Position on screen', description: 'Which edge of the screen the Dock appears on', domain: 'com.apple.dock', key: 'orientation', type: 'string', defaultValue: 'bottom', options: [{ value: 'bottom', label: 'Bottom' }, { value: 'left', label: 'Left' }, { value: 'right', label: 'Right' }] },
	{ id: 'dock-mineffect', category: 'Dock', label: 'Minimize animation', description: 'Visual effect when minimizing windows to the Dock', domain: 'com.apple.dock', key: 'mineffect', type: 'string', defaultValue: 'genie', options: [{ value: 'genie', label: 'Genie' }, { value: 'scale', label: 'Scale' }] },
	{ id: 'dock-static-only', category: 'Dock', label: 'Show only active apps', description: 'Hide non-running apps from the Dock (cleaner, minimalist look)', domain: 'com.apple.dock', key: 'static-only', type: 'bool', defaultValue: 'false' },
	{ id: 'dock-launchanim', category: 'Dock', label: 'Animate app launches', description: 'Bounce icons in the Dock when launching an app', domain: 'com.apple.dock', key: 'launchanim', type: 'bool', defaultValue: 'true' },

	// Finder
	{ id: 'finder-view-style', category: 'Finder', label: 'Default view style', description: 'How files are displayed in new Finder windows', domain: 'com.apple.finder', key: 'FXPreferredViewStyle', type: 'string', defaultValue: 'Nlsv', options: [{ value: 'icnv', label: 'Icon' }, { value: 'Nlsv', label: 'List' }, { value: 'clmv', label: 'Column' }, { value: 'glyv', label: 'Gallery' }] },
	{ id: 'finder-new-window', category: 'Finder', label: 'New window opens', description: 'Default location when opening a new Finder window', domain: 'com.apple.finder', key: 'NewWindowTarget', type: 'string', defaultValue: 'PfHm', options: [{ value: 'PfHm', label: 'Home folder' }, { value: 'PfDo', label: 'Documents' }, { value: 'PfDe', label: 'Desktop' }, { value: 'PfCm', label: 'Computer' }] },
	{ id: 'finder-search-scope', category: 'Finder', label: 'Default search scope', description: 'Where Finder searches by default when you use the search bar', domain: 'com.apple.finder', key: 'FXDefaultSearchScope', type: 'string', defaultValue: 'SCcf', options: [{ value: 'SCev', label: 'This Mac' }, { value: 'SCcf', label: 'Current folder' }, { value: 'SCsp', label: 'Previous scope' }] },
	{ id: 'finder-show-pathbar', category: 'Finder', label: 'Show path bar', description: 'Display the full folder path at the bottom of Finder windows', domain: 'com.apple.finder', key: 'ShowPathbar', type: 'bool', defaultValue: 'true' },
	{ id: 'finder-show-statusbar', category: 'Finder', label: 'Show status bar', description: 'Display item count and available disk space at the bottom of windows', domain: 'com.apple.finder', key: 'ShowStatusBar', type: 'bool', defaultValue: 'true' },
	{ id: 'finder-show-hidden', category: 'Finder', label: 'Show hidden files', description: 'Show files and folders whose names start with a dot', domain: 'com.apple.finder', key: 'AppleShowAllFiles', type: 'bool', defaultValue: 'false' },
	{ id: 'finder-show-extensions', category: 'Finder', label: 'Always show file extensions', description: 'Show filename extensions for all files, even when macOS would hide them', domain: 'NSGlobalDomain', key: 'AppleShowAllExtensions', type: 'bool', defaultValue: 'true' },
	{ id: 'finder-posix-path', category: 'Finder', label: 'Show full path in title bar', description: 'Display the complete POSIX path in the Finder window title', domain: 'com.apple.finder', key: '_FXShowPosixPathInTitle', type: 'bool', defaultValue: 'false' },

	// Trackpad
	{ id: 'trackpad-tap-click', category: 'Trackpad', label: 'Tap to click', description: 'Tap the trackpad with one finger to click, instead of pressing down', domain: 'com.apple.AppleMultitouchTrackpad', key: 'Clicking', type: 'bool', defaultValue: 'true' },
	{ id: 'trackpad-natural-scroll', category: 'Trackpad', label: 'Natural scrolling', description: 'Scroll content in the direction your fingers move (iOS-style)', domain: 'NSGlobalDomain', key: 'com.apple.swipescrolldirection', type: 'bool', defaultValue: 'true' },
	{ id: 'trackpad-three-finger-drag', category: 'Trackpad', label: 'Three-finger drag', description: 'Drag windows and items using three fingers on the trackpad', domain: 'com.apple.AppleMultitouchTrackpad', key: 'TrackpadThreeFingerDrag', type: 'bool', defaultValue: 'false' },

	// Desktop
	{ id: 'desktop-click-to-show', category: 'Desktop', label: 'Click desktop to show it', description: 'Click the desktop wallpaper to bring it to the front and hide all windows', domain: 'com.apple.WindowManager', key: 'EnableStandardClickToShowDesktop', type: 'bool', defaultValue: 'false' },

	// Keyboard
	{ id: 'keyboard-key-repeat', category: 'Keyboard', label: 'Key repeat rate', description: 'How fast keys repeat when held down — lower number = faster (min 1)', domain: 'NSGlobalDomain', key: 'KeyRepeat', type: 'int', defaultValue: '2', min: 1, max: 15 },
	{ id: 'keyboard-initial-repeat', category: 'Keyboard', label: 'Delay until key repeat', description: 'How long to hold a key before it starts repeating — lower = shorter delay', domain: 'NSGlobalDomain', key: 'InitialKeyRepeat', type: 'int', defaultValue: '15', min: 10, max: 120 },
	{ id: 'keyboard-press-hold', category: 'Keyboard', label: 'Press and hold for accents', description: 'Show accent character menu when holding a key (disable for faster key repeat)', domain: 'NSGlobalDomain', key: 'ApplePressAndHoldEnabled', type: 'bool', defaultValue: 'false' },

	// Screenshots
	{ id: 'screenshot-type', category: 'Screenshots', label: 'Screenshot format', description: 'File format used when saving screenshots', domain: 'com.apple.screencapture', key: 'type', type: 'string', defaultValue: 'png', options: [{ value: 'png', label: 'PNG' }, { value: 'jpg', label: 'JPEG' }, { value: 'pdf', label: 'PDF' }, { value: 'tiff', label: 'TIFF' }] },
	{ id: 'screenshot-no-shadow', category: 'Screenshots', label: 'Disable window shadows', description: 'Remove drop shadows from screenshots of individual windows', domain: 'com.apple.screencapture', key: 'disable-shadow', type: 'bool', defaultValue: 'true' },

	// Menu Bar
	{ id: 'menubar-sound', category: 'Menu Bar', label: 'Show Sound in menu bar', description: 'Always show the volume/sound control in the menu bar', domain: 'com.apple.controlcenter', key: 'NSStatusItem Visible Sound', type: 'bool', defaultValue: 'true' },
];

export const CATALOG_CATEGORIES = [...new Set(MACOS_PREF_CATALOG.map(p => p.category))];

export function getCatalogItem(domain: string, key: string): MacOSPrefCatalogItem | undefined {
	return MACOS_PREF_CATALOG.find(p => p.domain === domain && p.key === key);
}
