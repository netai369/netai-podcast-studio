<script lang="ts">
	export let name: string;
	export let className = '';

	const icons: Record<string, string> = {
		mic: `<path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line>`,
		playCircle: `<circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon>`,
        pauseCircle: `<circle cx="12" cy="12" r="10"></circle><line x1="10" y1="15" x2="10" y2="9"></line><line x1="14" y1="15" x2="14" y2="9"></line>`,
		arrowLeft: `<path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path>`,
		edit3: `<path d="M12 20h9"></path><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"></path>`,
		uploadCloud: `<path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path><path d="M12 12v9"></path><path d="m16 16-4-4-4 4"></path>`,
		fileText: `<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path>`,
		x: `<path d="M18 6 6 18"></path><path d="m6 6 12 12"></path>`,
		download: `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" x2="12" y1="15" y2="3"></line>`,
		settings: `<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle>`,
        gb: `<g clip-path="url(#a-gb)"><path d="M0 0v30h60V0z" fill="#012169"/><path d="M0 0l60 30m0-30L0 30" stroke="#fff" stroke-width="6"/><path d="M0 0l60 30m0-30L0 30" clip-path="url(#b-gb)" stroke="#C8102E" stroke-width="4"/><path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#C8102E" stroke-width="6"/></g><defs><clipPath id="b-gb"><path d="M30 15h30v15zv15h-30z"/></clipPath><clipPath id="a-gb"><path d="M0 0h60v30H0z"/></clipPath></defs>`,
        de: `<path d="M0 0h5v3H0z"/><path d="M0 1h5v2H0z" fill="#D00"/><path d="M0 2h5v1H0z" fill="#FFCE00"/>`,
        es: `<path d="M0 0h750v500H0z" fill="#c60b1e"/><path d="M0 125h750v250H0z" fill="#ffc400"/>`,
        fr: `<path d="M0 0h900v600H0z" fill="#fff"/><path d="M0 0h300v600H0z" fill="#002654"/><path d="M600 0h300v600H600z" fill="#ED2939"/>`,
        it: `<path d="M0 0h1500v1000H0z" fill="#fff"/><path d="M0 0h500v1000H0z" fill="#009246"/><path d="M1000 0h500v1000h-500z" fill="#CE2B37"/>`
	};

    const iconContent = icons[name];
    
    const viewBoxes: Record<string, string> = {
        gb: "0 0 60 30",
        de: "0 0 5 3",
        es: "0 0 750 500",
        fr: "0 0 900 600",
        it: "0 0 1500 1000"
    }
</script>

<svg 
    class={className} 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox={viewBoxes[name] || "0 0 24 24"} 
    fill={viewBoxes[name] ? undefined : "none"} 
    stroke={viewBoxes[name] ? undefined : "currentColor"} 
    stroke-width={viewBoxes[name] ? undefined : "2"} 
    stroke-linecap={viewBoxes[name] ? undefined : "round"} 
    stroke-linejoin={viewBoxes[name] ? undefined : "round"}
>
    {@html iconContent}
</svg>
