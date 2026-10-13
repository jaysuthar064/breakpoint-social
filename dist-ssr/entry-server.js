import { renderToString } from "react-dom/server";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
//#region src/lib/api.js
/**
* Reads the public API.
*
* The whole site arrives in one `/snapshot` call. For a marketing site this
* size that is a single request instead of a dozen, and it is what the
* prerender step consumes too, so the static HTML and the live page are built
* from exactly the same data.
*/
var API_BASE = "http://localhost:8887/index.php?rest_route=";
/**
* Builds a REST URL that works with or without pretty permalinks.
*/
function apiUrl(path) {
	return API_BASE.includes("rest_route=") ? `${API_BASE}${encodeURIComponent(path)}` : `${API_BASE.replace(/\/$/, "")}${path}`;
}
/**
* Fetches the whole published site.
*/
async function fetchSnapshot(signal) {
	const response = await fetch(apiUrl("/bps/v1/snapshot"), { signal });
	if (!response.ok) throw new Error(`The site content could not be loaded (${response.status}).`);
	return response.json();
}
/**
* Asks for a contact-form token.
*
* The server uses it to reject submissions that arrive impossibly fast, which
* is most of the spam.
*/
async function fetchContactToken() {
	const response = await fetch(apiUrl("/bps/v1/contact/token"));
	if (!response.ok) throw new Error("The contact form could not be prepared.");
	return response.json();
}
/**
* Submits the contact form.
*/
async function submitContact(payload) {
	const response = await fetch(apiUrl("/bps/v1/contact"), {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(payload)
	});
	const body = await response.json().catch(() => ({}));
	if (!response.ok) {
		const error = new Error(body.message ?? "That could not be sent.");
		error.field = body.data?.field ?? null;
		throw error;
	}
	return body;
}
var SNAPSHOT_KEY = "bps.snapshot.v1";
/**
* Reads a previously fetched snapshot from this browsing session.
*
* The API takes around a second to answer, and without this every reload pays
* it again. Session storage is the right scope: it survives reloads and
* in-session navigation, and is gone when the tab closes, so an editor never
* ends up looking at yesterday's content.
*
* Every access is wrapped: storage throws in private mode and in some embedded
* webviews, and a cache miss must never be fatal.
*/
function readCachedSnapshot() {
	try {
		const raw = sessionStorage.getItem(SNAPSHOT_KEY);
		if (!raw) return null;
		const parsed = JSON.parse(raw);
		if (!parsed.at || Date.now() - parsed.at > 12e4) return null;
		return parsed.data ?? null;
	} catch {
		return null;
	}
}
/**
* Stores the snapshot for the rest of the session.
*/
function cacheSnapshot(data) {
	try {
		sessionStorage.setItem(SNAPSHOT_KEY, JSON.stringify({
			at: Date.now(),
			data
		}));
	} catch {}
}
//#endregion
//#region src/lib/headings.js
/**
* Promotes heading levels inside CMS body copy.
*
* The editor writes h3 and h4, which is the right choice inside a section that
* already has its own h2. But when a body sits directly under the page h1 with
* no h2 between them, those h3s create a level skip, and screen reader users
* navigating by heading land on a structure that claims a missing level.
*
* Rather than restrict what the editor can write, the level is adjusted at
* render time to match the surrounding document.
*
* @param {string}  html    Sanitised body HTML from the API.
* @param {boolean} promote True when the body is the first thing under the h1.
*/
function fixHeadingLevels(html, promote) {
	if (!html || !promote) return html ?? "";
	return html.replace(/<(\/?)h4(\s|>)/g, "<$1h3$2").replace(/<(\/?)h3(\s|>)/g, "<$1h2$2");
}
//#endregion
//#region src/lib/motion.js
/**
* The motion layer beyond scroll reveal.
*
* Three techniques, each chosen because it does something a fade cannot, and
* each a progressive enhancement: if the browser lacks the API, or the reader
* has asked for less movement, the page is simply still and complete.
*
*  1. View Transitions   - routes cross-fade as one document instead of
*                          snapping, which is what makes a client-side site
*                          stop feeling like a series of blank flashes.
*  2. Magnetic pointer   - the primary call to action leans toward the cursor.
*                          Pointer-driven, never scroll-driven.
*  3. Scroll progress    - a reading indicator on long articles, driven by the
*                          native scroll timeline so it costs no JavaScript
*                          frame time at all.
*/
var REDUCED = "(prefers-reduced-motion: reduce)";
function reducedMotion() {
	return typeof window !== "undefined" && window.matchMedia(REDUCED).matches;
}
/**
* Runs a route change inside a View Transition when the browser supports one.
*
* Falls through to calling the update directly, so navigation never depends on
* the API being present.
*
* @param {Function} update Performs the actual navigation.
*/
function withViewTransition(update) {
	if (typeof document === "undefined" || !document.startViewTransition || reducedMotion()) {
		update();
		return;
	}
	document.startViewTransition(() => update());
}
/**
* Makes an element lean toward the pointer.
*
* Deliberately subtle and capped: a button that chases the cursor across the
* page is a gimmick, one that shifts a few pixels reads as responsive. Skipped
* entirely on coarse pointers, where there is no cursor to follow and the
* transform would only fight the tap.
*/
function initMagnetic() {
	if (typeof window === "undefined" || reducedMotion()) return () => {};
	if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return () => {};
	const STRENGTH = .22;
	const MAX = 7;
	const onMove = (event) => {
		const target = event.target.closest?.("[data-magnetic]");
		if (!target) return;
		const box = target.getBoundingClientRect();
		const dx = event.clientX - (box.left + box.width / 2);
		const dy = event.clientY - (box.top + box.height / 2);
		const x = Math.max(-7, Math.min(MAX, dx * STRENGTH));
		const y = Math.max(-7, Math.min(MAX, dy * STRENGTH));
		target.style.transform = `translate(${x}px, ${y}px)`;
	};
	const onLeave = (event) => {
		const target = event.target.closest?.("[data-magnetic]");
		if (target) target.style.transform = "";
	};
	document.addEventListener("pointermove", onMove, { passive: true });
	document.addEventListener("pointerleave", onLeave, true);
	return () => {
		document.removeEventListener("pointermove", onMove);
		document.removeEventListener("pointerleave", onLeave, true);
	};
}
/**
* Whether the browser can drive an animation from the scroll position itself.
*
* When it can, the reading progress bar is pure CSS and never touches the main
* thread. When it cannot, the bar is simply not shown: a progress indicator is
* a nicety, and faking it with a scroll listener would cost more than it is
* worth.
*/
function supportsScrollTimeline() {
	return typeof CSS !== "undefined" && CSS.supports?.("animation-timeline: scroll()") === true && !reducedMotion();
}
//#endregion
//#region src/lib/reveal.js
/**
* Scroll-reveal, built on IntersectionObserver.
*
* Deliberately NOT a scroll listener. A `scroll` handler fires on every frame,
* cannot be batched, and is the usual reason a site feels heavy on a phone.
* IntersectionObserver does the same job off the main thread.
*
* The guiding rule is that content must never depend on this to be visible:
*
*  - The CSS only hides an element once `data-reveal-ready` is on <html>, and
*    only this script sets it. No JavaScript means nothing is ever hidden, so
*    the prerendered HTML a crawler sees is the finished page.
*  - Under `prefers-reduced-motion` the attribute is never set at all, so the
*    page renders complete and still.
*  - Anything already on screen at load is revealed immediately rather than
*    animated, so the first paint is not a wave of fading boxes.
*/
var REVEAL_SELECTOR = "[data-reveal]";
function initReveal() {
	if (typeof window === "undefined" || typeof document === "undefined") return () => {};
	const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
	if (prefersReduced.matches || !("IntersectionObserver" in window)) {
		document.documentElement.removeAttribute("data-reveal-ready");
		return () => {};
	}
	document.documentElement.setAttribute("data-reveal-ready", "");
	const observer = new IntersectionObserver((entries) => {
		entries.forEach((entry) => {
			if (!entry.isIntersecting) return;
			entry.target.setAttribute("data-revealed", "");
			observer.unobserve(entry.target);
		});
	}, {
		rootMargin: "0px 0px -12% 0px",
		threshold: .08
	});
	const observe = () => {
		document.querySelectorAll(REVEAL_SELECTOR).forEach((element) => {
			if (element.hasAttribute("data-revealed")) return;
			if (element.getBoundingClientRect().top < window.innerHeight * .9) {
				element.setAttribute("data-revealed", "");
				return;
			}
			observer.observe(element);
		});
	};
	observe();
	const mutation = new MutationObserver(() => observe());
	mutation.observe(document.body, {
		childList: true,
		subtree: true
	});
	const onPreferenceChange = (event) => {
		if (event.matches) {
			document.documentElement.removeAttribute("data-reveal-ready");
			observer.disconnect();
		}
	};
	prefersReduced.addEventListener("change", onPreferenceChange);
	return () => {
		observer.disconnect();
		mutation.disconnect();
		prefersReduced.removeEventListener("change", onPreferenceChange);
	};
}
//#endregion
//#region src/lib/router.jsx
/**
* A history-API router.
*
* Real paths, not hashes: the site has to be crawlable and the prerender step
* writes one HTML file per path. A hash route would leave every page sharing a
* single URL as far as a crawler is concerned.
*/
var RouterContext = createContext({
	path: "/",
	navigate: () => {}
});
function normalise(path) {
	if (!path || path === "/") return "/";
	return `${path.replace(/\/+$/, "")}/`;
}
function currentPath(fallback = "/") {
	if (typeof window === "undefined") return normalise(fallback);
	return normalise(window.location.pathname);
}
/**
* `initialPath` is what makes prerendering possible: on the server there is no
* `window.location` to read, so the route has to be passed in.
*/
function RouterProvider({ children, initialPath = "/" }) {
	const [path, setPath] = useState(() => currentPath(initialPath));
	useEffect(() => {
		const onPop = () => setPath(currentPath());
		window.addEventListener("popstate", onPop);
		return () => window.removeEventListener("popstate", onPop);
	}, []);
	const navigate = useCallback((to, { replace = false } = {}) => {
		const target = normalise(to);
		withViewTransition(() => {
			if (replace) window.history.replaceState({}, "", target);
			else window.history.pushState({}, "", target);
			setPath(target);
			window.scrollTo({
				top: 0,
				behavior: "instant"
			});
		});
	}, []);
	const value = useMemo(() => ({
		path,
		navigate
	}), [path, navigate]);
	return /* @__PURE__ */ jsx(RouterContext.Provider, {
		value,
		children
	});
}
function useRouter() {
	return useContext(RouterContext);
}
/**
* An internal link.
*
* Renders a real anchor with a real href, so middle-click, copy-link, "open in
* new tab" and crawlers all behave. The click handler is an enhancement that
* avoids a full page load, and it steps aside for modified clicks.
*/
function Link({ to, children, className, ...rest }) {
	const { navigate } = useRouter();
	if (/^https?:\/\//.test(to) || to.startsWith("mailto:") || to.startsWith("tel:")) return /* @__PURE__ */ jsx("a", {
		href: to,
		className,
		rel: "noopener",
		...rest,
		children
	});
	if (to.startsWith("#")) return /* @__PURE__ */ jsx("a", {
		href: to,
		className,
		...rest,
		children
	});
	const [pathPart, hash] = to.split("#");
	const onClick = (event) => {
		if (event.defaultPrevented || event.button !== 0) return;
		if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
		event.preventDefault();
		navigate(pathPart);
		if (hash) requestAnimationFrame(() => {
			document.getElementById(hash)?.scrollIntoView({ behavior: "smooth" });
		});
	};
	return /* @__PURE__ */ jsx("a", {
		href: to,
		onClick,
		className,
		...rest,
		children
	});
}
//#endregion
//#region src/components/Chrome.jsx
/**
* Header, footer and the skip link: everything that wraps every page.
*/
var CONTACT = {
	taylor: {
		name: "Taylor",
		phone: "+1 (818) 312-5428",
		email: "taylor@breakpointsocial.com"
	},
	nick: {
		name: "Nick Toth",
		phone: "+1 (310) 775-3944",
		email: "nick.toth@breakpointsocial.com"
	}
};
var SOCIAL = [
	{
		label: "TikTok",
		href: "https://www.tiktok.com/@breakpointsocial"
	},
	{
		label: "LinkedIn",
		href: "https://www.linkedin.com/company/breakpointsocial"
	},
	{
		label: "Instagram",
		href: "https://www.instagram.com/breakpointsocial"
	}
];
function SkipLink() {
	return /* @__PURE__ */ jsx("a", {
		href: "#main",
		className: "sr-only rounded-full bg-[#84572f] px-4 py-2 text-sm text-white focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50",
		children: "Skip to content"
	});
}
function Header({ nav, branding }) {
	const { path } = useRouter();
	const [open, setOpen] = useState(false);
	useEffect(() => {
		setOpen(false);
	}, [path]);
	const items = nav ?? [];
	return /* @__PURE__ */ jsxs("header", {
		className: "sticky top-0 z-40 border-b border-[#84572f]/10 bg-[#fcf5e9]/90 backdrop-blur-md",
		children: [/* @__PURE__ */ jsxs("div", {
			className: "mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8",
			children: [
				/* @__PURE__ */ jsx(Link, {
					to: "/",
					className: "flex items-center gap-2",
					"aria-label": "Breakpoint Social, home",
					children: branding?.logo?.url ? /* @__PURE__ */ jsx("img", {
						src: branding.logo.url,
						alt: "",
						width: branding.logo.width || void 0,
						height: branding.logo.height || void 0,
						loading: "eager",
						fetchPriority: "high",
						style: { filter: "brightness(0.4) saturate(1.15)" },
						className: "h-9 w-auto shrink-0 transition-opacity duration-200 hover:opacity-80"
					}) : /* @__PURE__ */ jsx("span", {
						className: "font-display text-lg font-extrabold tracking-tight text-[#141615]",
						children: "Breakpoint Social"
					})
				}),
				/* @__PURE__ */ jsxs("nav", {
					"aria-label": "Main",
					className: "hidden items-center gap-1 lg:flex",
					children: [items.map((item) => {
						const current = path === item.path;
						return /* @__PURE__ */ jsx(Link, {
							to: item.path,
							"aria-current": current ? "page" : void 0,
							className: ["rounded-full px-3.5 py-2 text-sm transition-colors duration-200", current ? "font-semibold text-[#84572f]" : "text-[#141615]/75 hover:text-[#84572f]"].join(" "),
							children: item.label
						}, item.id);
					}), /* @__PURE__ */ jsx(Link, {
						to: "/contact-us/",
						className: "ml-2 inline-flex items-center rounded-full bg-[#84572f] px-5 py-2.5 text-xs font-semibold tracking-wider text-white uppercase transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#6c4625]",
						children: "Get in touch"
					})]
				}),
				/* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: () => setOpen((current) => !current),
					"aria-expanded": open,
					"aria-controls": "mobile-nav",
					className: "min-h-11 rounded-lg px-4 py-2 text-sm font-semibold text-[#141615] lg:hidden",
					children: open ? "Close" : "Menu"
				})
			]
		}), open && /* @__PURE__ */ jsx("nav", {
			id: "mobile-nav",
			"aria-label": "Main",
			className: "border-t border-[#84572f]/10 bg-[#fcf5e9] px-4 pb-4 lg:hidden",
			children: /* @__PURE__ */ jsx("ul", {
				className: "flex flex-col gap-0.5 pt-2",
				children: items.map((item) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, {
					to: item.path,
					"aria-current": path === item.path ? "page" : void 0,
					className: ["flex min-h-11 items-center rounded-lg px-3 py-2.5 text-base", path === item.path ? "bg-[#f1d5a0]/30 font-semibold text-[#84572f]" : "text-[#1c1c1c] hover:bg-[#92ada4]/15"].join(" "),
					children: item.label
				}) }, item.id))
			})
		})]
	});
}
function Footer({ nav, branding }) {
	const items = nav ?? [];
	return /* @__PURE__ */ jsx("footer", {
		className: "bg-[#141615] text-white",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "grid gap-12 border-b border-neutral-800 pb-16 md:grid-cols-2 lg:grid-cols-4",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "lg:col-span-2",
						children: [
							branding?.logo?.url ? /* @__PURE__ */ jsx("img", {
								src: branding.logoDark?.url ?? branding.logo.url,
								alt: "Breakpoint Social",
								width: (branding.logoDark ?? branding.logo).width || void 0,
								height: (branding.logoDark ?? branding.logo).height || void 0,
								className: `h-10 w-auto ${branding.logoDark ? "" : "brightness-0 invert"}`
							}) : /* @__PURE__ */ jsx("p", {
								className: "font-display text-xl font-extrabold tracking-tight",
								children: "Breakpoint Social"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-3 max-w-sm leading-relaxed text-white/70",
								children: "A San Diego social media and influencer marketing agency. We engineer campaigns that spark movements, not just posts."
							}),
							/* @__PURE__ */ jsx("ul", {
								className: "mt-6 flex gap-4",
								children: SOCIAL.map((social) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs("a", {
									href: social.href,
									rel: "noopener noreferrer",
									target: "_blank",
									className: "text-sm text-white/70 underline-offset-4 transition-colors hover:text-[#f1d5a0] hover:underline",
									children: [social.label, /* @__PURE__ */ jsx("span", {
										className: "sr-only",
										children: " (opens in a new window)"
									})]
								}) }, social.label))
							})
						]
					}),
					/* @__PURE__ */ jsxs("nav", {
						"aria-label": "Footer",
						children: [/* @__PURE__ */ jsx("h2", {
							className: "font-mono text-xs font-semibold tracking-wider text-[#f1d5a0] uppercase",
							children: "Explore"
						}), /* @__PURE__ */ jsx("ul", {
							className: "mt-4 flex flex-col gap-2",
							children: items.map((item) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, {
								to: item.path,
								className: "text-sm text-white/70 transition-colors hover:text-[#f1d5a0]",
								children: item.label
							}) }, item.id))
						})]
					}),
					/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h2", {
						className: "font-mono text-xs font-semibold tracking-wider text-[#f1d5a0] uppercase",
						children: "Contact"
					}), /* @__PURE__ */ jsx("ul", {
						className: "mt-4 flex flex-col gap-4 text-sm text-white/70",
						children: Object.values(CONTACT).map((person) => /* @__PURE__ */ jsxs("li", { children: [
							/* @__PURE__ */ jsx("p", {
								className: "font-semibold text-white",
								children: person.name
							}),
							/* @__PURE__ */ jsx("a", {
								href: `tel:${person.phone.replace(/[^+\d]/g, "")}`,
								className: "block transition-colors hover:text-[#f1d5a0]",
								children: person.phone
							}),
							/* @__PURE__ */ jsx("a", {
								href: `mailto:${person.email}`,
								className: "block break-all transition-colors hover:text-[#f1d5a0]",
								children: person.email
							})
						] }, person.email))
					})] })
				]
			}), /* @__PURE__ */ jsxs("p", {
				className: "pt-8 text-xs text-white/50",
				children: [
					"© ",
					(/* @__PURE__ */ new Date()).getFullYear(),
					" Breakpoint Social. All rights reserved."
				]
			})]
		})
	});
}
//#endregion
//#region src/components/Loading.jsx
/**
* What the page shows while the content is still in flight.
*
* Shaped like the real layout rather than a spinner: a skeleton that matches
* the header bar and hero means the page appears to assemble, and the moment
* content arrives nothing jumps. A centred spinner tells the reader to wait
* without telling them what for.
*/
function Loading() {
	return /* @__PURE__ */ jsxs("div", {
		role: "status",
		"aria-live": "polite",
		"aria-busy": "true",
		className: "min-h-[100dvh] bg-[#fcf5e9]",
		children: [
			/* @__PURE__ */ jsx("span", {
				className: "sr-only",
				children: "Loading the site"
			}),
			/* @__PURE__ */ jsx("div", {
				className: "border-b border-[#84572f]/10 bg-[#fcf5e9]/90",
				children: /* @__PURE__ */ jsxs("div", {
					className: "mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8",
					children: [
						/* @__PURE__ */ jsx("div", { className: "skeleton h-9 w-40 rounded-lg" }),
						/* @__PURE__ */ jsxs("div", {
							className: "hidden items-center gap-6 lg:flex",
							children: [[
								64,
								44,
								72,
								60,
								58,
								72
							].map((width, index) => /* @__PURE__ */ jsx("div", {
								className: "skeleton h-4 rounded",
								style: { width }
							}, index)), /* @__PURE__ */ jsx("div", { className: "skeleton h-10 w-32 rounded-full" })]
						}),
						/* @__PURE__ */ jsx("div", { className: "skeleton h-9 w-16 rounded-lg lg:hidden" })
					]
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 md:py-32 lg:px-8",
				children: [
					/* @__PURE__ */ jsx("div", { className: "skeleton mx-auto h-12 w-full max-w-2xl rounded-xl sm:h-16" }),
					/* @__PURE__ */ jsx("div", { className: "skeleton mx-auto mt-4 h-12 w-4/5 max-w-xl rounded-xl sm:h-16" }),
					/* @__PURE__ */ jsx("div", { className: "skeleton mx-auto mt-8 h-4 w-full max-w-lg rounded" }),
					/* @__PURE__ */ jsx("div", { className: "skeleton mx-auto mt-3 h-4 w-3/5 max-w-sm rounded" }),
					/* @__PURE__ */ jsxs("div", {
						className: "mt-10 flex flex-wrap items-center justify-center gap-3",
						children: [/* @__PURE__ */ jsx("div", { className: "skeleton h-12 w-40 rounded-full" }), /* @__PURE__ */ jsx("div", { className: "skeleton h-12 w-36 rounded-full" })]
					})
				]
			})
		]
	});
}
//#endregion
//#region src/components/ContactForm.jsx
/**
* The enquiry form.
*
* The field list comes from the server so the form and the validator can never
* disagree about what is required.
*/
function ContactForm({ submitLabel = "Submit", successTitle, successBody }) {
	const [fields, setFields] = useState([]);
	const [token, setToken] = useState("");
	const [values, setValues] = useState({});
	const [errors, setErrors] = useState({});
	const [status, setStatus] = useState("loading");
	const [message, setMessage] = useState("");
	const summaryRef = useRef(null);
	useEffect(() => {
		let cancelled = false;
		fetchContactToken().then((data) => {
			if (cancelled) return;
			setFields(data.fields ?? []);
			setToken(data.token ?? "");
			setStatus("ready");
		}).catch(() => {
			if (!cancelled) {
				setStatus("failed");
				setMessage("The form could not be loaded. Please email taylor@breakpointsocial.com.");
			}
		});
		return () => {
			cancelled = true;
		};
	}, []);
	const setValue = (key, value) => {
		setValues((current) => ({
			...current,
			[key]: value
		}));
		setErrors((current) => {
			if (!current[key]) return current;
			const next = { ...current };
			delete next[key];
			return next;
		});
	};
	const onSubmit = async (event) => {
		event.preventDefault();
		const found = {};
		fields.forEach((field) => {
			if (field.required && !String(values[field.key] ?? "").trim()) found[field.key] = `${field.label} is required.`;
		});
		if (Object.keys(found).length > 0) {
			setErrors(found);
			requestAnimationFrame(() => summaryRef.current?.focus());
			return;
		}
		setStatus("sending");
		setErrors({});
		try {
			const result = await submitContact({
				...values,
				token
			});
			setStatus("sent");
			setMessage(result.message ?? "");
		} catch (error) {
			setStatus("ready");
			if (error.field) {
				setErrors({ [error.field]: error.message });
				requestAnimationFrame(() => summaryRef.current?.focus());
			} else setMessage(error.message);
		}
	};
	if (status === "sent") return /* @__PURE__ */ jsxs("div", {
		role: "status",
		className: "mx-auto max-w-xl rounded-2xl border border-[#84572f]/10 bg-white p-8 text-center shadow-sm",
		children: [/* @__PURE__ */ jsx("h3", {
			className: "text-2xl font-extrabold tracking-tight text-[#141615]",
			children: successTitle || "Thank you. We will be in touch."
		}), /* @__PURE__ */ jsx("p", {
			className: "mt-3 leading-relaxed text-[#141615]/70",
			children: successBody || message
		})]
	});
	if (status === "loading") return /* @__PURE__ */ jsx("p", {
		role: "status",
		className: "py-10 text-center text-[#141615]/60",
		children: "Loading the form."
	});
	const errorList = Object.entries(errors);
	return /* @__PURE__ */ jsxs("form", {
		onSubmit,
		noValidate: true,
		className: "mx-auto max-w-3xl",
		children: [
			errorList.length > 0 && /* @__PURE__ */ jsxs("div", {
				ref: summaryRef,
				tabIndex: -1,
				role: "alert",
				className: "mb-6 rounded-2xl border border-red-300 bg-red-50 p-5",
				children: [/* @__PURE__ */ jsx("h3", {
					className: "font-extrabold tracking-tight text-red-800",
					children: "There is a problem"
				}), /* @__PURE__ */ jsx("ul", {
					className: "mt-2 list-disc pl-5 text-sm text-red-800",
					children: errorList.map(([key, text]) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx("a", {
						href: `#contact-${key}`,
						className: "underline",
						children: text
					}) }, key))
				})]
			}),
			message && errorList.length === 0 && /* @__PURE__ */ jsx("p", {
				role: "alert",
				className: "mb-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800",
				children: message
			}),
			/* @__PURE__ */ jsx("div", {
				className: "grid gap-5 sm:grid-cols-2",
				children: fields.map((field) => {
					const isWide = field.type === "textarea";
					return /* @__PURE__ */ jsxs("div", {
						className: isWide ? "sm:col-span-2" : "",
						children: [
							/* @__PURE__ */ jsxs("label", {
								htmlFor: `contact-${field.key}`,
								className: "mb-1.5 block text-xs font-semibold tracking-wide text-[#141615]",
								children: [field.label, field.required && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("span", {
									"aria-hidden": "true",
									className: "ml-1 text-red-700",
									children: "*"
								}), /* @__PURE__ */ jsx("span", {
									className: "sr-only",
									children: " (required)"
								})] })]
							}),
							isWide ? /* @__PURE__ */ jsx("textarea", {
								id: `contact-${field.key}`,
								rows: 4,
								value: values[field.key] ?? "",
								"aria-invalid": errors[field.key] ? true : void 0,
								"aria-describedby": errors[field.key] ? `contact-${field.key}-error` : void 0,
								onChange: (event) => setValue(field.key, event.target.value),
								className: "w-full rounded-xl border border-[#9a8a6d] bg-white px-4 py-3 text-[#1a1a1a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#84572f]"
							}) : /* @__PURE__ */ jsx("input", {
								id: `contact-${field.key}`,
								type: field.type,
								autoComplete: field.autocomplete,
								value: values[field.key] ?? "",
								"aria-invalid": errors[field.key] ? true : void 0,
								"aria-describedby": errors[field.key] ? `contact-${field.key}-error` : void 0,
								onChange: (event) => setValue(field.key, event.target.value),
								className: "w-full rounded-xl border border-[#9a8a6d] bg-white px-4 py-3 text-[#1a1a1a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#84572f]"
							}),
							errors[field.key] && /* @__PURE__ */ jsx("p", {
								id: `contact-${field.key}-error`,
								className: "mt-1.5 text-xs text-red-700",
								children: errors[field.key]
							})
						]
					}, field.key);
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				"aria-hidden": "true",
				className: "absolute left-[-9999px] h-0 w-0 overflow-hidden",
				children: [/* @__PURE__ */ jsx("label", {
					htmlFor: "contact-company_website",
					children: "Company website"
				}), /* @__PURE__ */ jsx("input", {
					id: "contact-company_website",
					type: "text",
					tabIndex: -1,
					autoComplete: "off",
					value: values.company_website ?? "",
					onChange: (event) => setValue("company_website", event.target.value)
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "mt-7",
				children: /* @__PURE__ */ jsx("button", {
					type: "submit",
					disabled: status === "sending",
					"aria-busy": status === "sending" || void 0,
					className: "inline-flex items-center justify-center gap-2 rounded-full bg-[#84572f] px-7 py-3.5 text-xs font-semibold tracking-wider text-white uppercase shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#6c4625] disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#84572f]",
					children: status === "sending" ? "Sending" : submitLabel
				})
			})
		]
	});
}
//#endregion
//#region src/components/sections.jsx
/**
* One component per registered section type.
*
* They live together because they share a single visual vocabulary: the band,
* the eyebrow, the heading, the grid. Splitting them across nine files would
* scatter that vocabulary without making any one of them easier to read.
*
* Every class here traces back to Documents/DESIGN-ANALYSIS.md.
*/
var BAND = {
	cream: "bg-[#fcf5e9] border-b border-[#84572f]/10",
	pale: "bg-[#f6f8f5] border-b border-[#84572f]/10",
	dark: "bg-[#141615] text-white border-b border-white/10"
};
var isDark = (band) => band === "dark";
/**
* A section band. `py-20 md:py-28` is the standard rhythm from the analysis.
*/
function Band({ background = "cream", children, id, wide = false }) {
	return /* @__PURE__ */ jsx("section", {
		id,
		className: `py-20 md:py-28 ${BAND[background] ?? BAND.cream}`,
		children: /* @__PURE__ */ jsx("div", {
			className: `mx-auto px-4 sm:px-6 lg:px-8 ${wide ? "max-w-7xl" : "max-w-7xl"}`,
			children
		})
	});
}
/**
* The small mono label above a heading.
*
* The design caps these at one per three sections, which is a page-composition
* rule rather than something a component can enforce; it renders only when the
* editor supplied one.
*/
function Eyebrow({ children, dark }) {
	if (!children) return null;
	return /* @__PURE__ */ jsx("span", {
		className: [
			"mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5",
			"font-mono text-xs font-semibold tracking-wider uppercase",
			dark ? "border border-[#f1d5a0]/30 bg-white/5 text-[#f1d5a0]" : "border border-[#84572f]/15 bg-[#92ada4]/15 text-[#141615]"
		].join(" "),
		children
	});
}
/**
* Eyebrow, heading and intro: the opening of nearly every section.
*/
function SectionHead({ eyebrow, heading, intro, dark, align = "center" }) {
	const centred = align === "center";
	return /* @__PURE__ */ jsxs("div", {
		"data-reveal": true,
		className: `mb-14 md:mb-20 ${centred ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}`,
		children: [
			/* @__PURE__ */ jsx(Eyebrow, {
				dark,
				children: eyebrow
			}),
			heading && /* @__PURE__ */ jsx("h2", {
				className: `text-3xl font-extrabold tracking-tight text-balance sm:text-5xl ${dark ? "text-white" : "text-[#141615]"}`,
				children: heading
			}),
			intro && /* @__PURE__ */ jsx("p", {
				className: `mt-5 text-lg leading-relaxed ${centred ? "mx-auto max-w-2xl" : ""} ${dark ? "text-white/80" : "text-[#141615]/75"}`,
				children: intro
			})
		]
	});
}
/**
* The clay pill. Every button on the site is this shape.
*/
function Button({ to, children, variant = "primary", className = "" }) {
	const styles = {
		primary: "bg-[#84572f] text-white hover:bg-[#6c4625] shadow-sm hover:shadow hover:-translate-y-0.5",
		secondary: "bg-[#92ada4]/15 text-[#84572f] hover:bg-[#92ada4]/25 hover:text-[#141615] border border-[#84572f]/20",
		onDark: "bg-[#f1d5a0] text-[#141615] hover:bg-[#f1d5a0]/90 shadow-sm hover:-translate-y-0.5"
	};
	return /* @__PURE__ */ jsx(Link, {
		to,
		"data-magnetic": variant === "primary" || variant === "onDark" ? "" : void 0,
		className: [
			"inline-flex items-center justify-center gap-2 rounded-full px-6 py-3",
			"text-xs font-semibold tracking-wider uppercase whitespace-nowrap",
			"transition-all duration-200",
			"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#84572f]",
			styles[variant] ?? styles.primary,
			className
		].join(" "),
		children
	});
}
/**
* Renders a CMS image, or nothing when the field was left empty.
*/
function Img({ image, className, sizes, priority = false, decorative = false }) {
	if (!image?.url) return null;
	return /* @__PURE__ */ jsx("img", {
		src: image.url,
		srcSet: image.srcset || void 0,
		sizes,
		alt: decorative ? "" : image.alt ?? "",
		width: image.width || void 0,
		height: image.height || void 0,
		loading: priority ? "eager" : "lazy",
		fetchPriority: priority ? "high" : void 0,
		decoding: "async",
		className
	});
}
function Hero({ section }) {
	const { fields, background } = section;
	const dark = isDark(background);
	return /* @__PURE__ */ jsx("section", {
		className: `relative overflow-hidden py-24 md:py-32 ${dark ? "bg-[#141615] text-white" : "bg-[#fcf5e9]"}`,
		children: /* @__PURE__ */ jsxs("div", {
			"data-reveal": true,
			className: "relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8",
			children: [
				/* @__PURE__ */ jsx(Eyebrow, {
					dark,
					children: fields.eyebrow
				}),
				/* @__PURE__ */ jsxs("h1", {
					className: `text-4xl leading-[1.08] font-extrabold tracking-tight text-balance sm:text-6xl lg:text-7xl ${dark ? "text-white" : "text-[#141615]"}`,
					children: [/* @__PURE__ */ jsx("span", {
						className: "hero-line",
						children: /* @__PURE__ */ jsx("span", { children: fields.heading })
					}), fields.script_accent && /* @__PURE__ */ jsx("span", {
						className: "hero-line",
						children: /* @__PURE__ */ jsx("span", {
							className: "font-script inline-block pb-1 text-4xl leading-[1.1] lowercase sm:text-6xl lg:text-7xl text-[#84572f]",
							children: fields.script_accent
						})
					})]
				}),
				fields.subtext && /* @__PURE__ */ jsx("p", {
					className: `mx-auto mt-6 max-w-2xl text-lg leading-relaxed ${dark ? "text-white/80" : "text-[#141615]/75"}`,
					children: fields.subtext
				}),
				(fields.primary_cta || fields.secondary_cta) && /* @__PURE__ */ jsxs("div", {
					className: "mt-9 flex flex-wrap items-center justify-center gap-3",
					children: [fields.primary_cta && /* @__PURE__ */ jsx(Button, {
						to: fields.primary_cta.url,
						variant: dark ? "onDark" : "primary",
						children: fields.primary_cta.label
					}), fields.secondary_cta && /* @__PURE__ */ jsx(Button, {
						to: fields.secondary_cta.url,
						variant: "secondary",
						children: fields.secondary_cta.label
					})]
				}),
				fields.image && /* @__PURE__ */ jsx("div", {
					className: "mt-14",
					children: /* @__PURE__ */ jsx(Img, {
						image: fields.image,
						sizes: "(min-width: 1024px) 64rem, 100vw",
						priority: true,
						className: "mx-auto rounded-2xl shadow-xl"
					})
				})
			]
		})
	});
}
function RichText({ section }) {
	const { fields, background } = section;
	const dark = isDark(background);
	return /* @__PURE__ */ jsx(Band, {
		background,
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-3xl",
			children: [(fields.eyebrow || fields.heading) && /* @__PURE__ */ jsx(SectionHead, {
				eyebrow: fields.eyebrow,
				heading: fields.heading,
				dark,
				align: "left"
			}), /* @__PURE__ */ jsx("div", {
				"data-reveal": true,
				className: `prose-bps ${dark ? "on-dark text-white/85" : "text-[#141615]/85"}`,
				dangerouslySetInnerHTML: { __html: fixHeadingLevels(fields.body ?? "", !fields.heading) }
			})]
		})
	});
}
function FeatureList({ section }) {
	const { fields, background } = section;
	const dark = isDark(background);
	const items = fields.items ?? [];
	return /* @__PURE__ */ jsxs(Band, {
		background,
		children: [/* @__PURE__ */ jsx(SectionHead, {
			eyebrow: fields.eyebrow,
			heading: fields.heading,
			intro: fields.intro,
			dark
		}), /* @__PURE__ */ jsx("ul", {
			"data-reveal": true,
			"data-reveal-stagger": true,
			className: "mx-auto grid max-w-5xl gap-6 sm:grid-cols-2",
			children: items.map((item, index) => /* @__PURE__ */ jsxs("li", {
				className: `rounded-2xl border p-6 ${dark ? "border-white/10 bg-white/5" : "border-[#84572f]/10 bg-white shadow-sm"}`,
				children: [/* @__PURE__ */ jsx("h3", {
					className: `text-lg font-extrabold tracking-tight ${dark ? "text-white" : "text-[#141615]"}`,
					children: item.title
				}), item.body && /* @__PURE__ */ jsx("p", {
					className: `mt-2 leading-relaxed ${dark ? "text-white/75" : "text-[#141615]/70"}`,
					children: item.body
				})]
			}, index))
		})]
	});
}
function IntroGrid({ section }) {
	const { fields, background, resolved } = section;
	const dark = isDark(background);
	const items = resolved?.items_source ?? [];
	const columns = fields.columns ?? "3";
	const gridCols = {
		2: "sm:grid-cols-2",
		3: "sm:grid-cols-2 lg:grid-cols-3",
		4: "sm:grid-cols-2 lg:grid-cols-4"
	};
	const span = Number(columns) > 1 && items.length % Number(columns) === 2;
	return /* @__PURE__ */ jsxs(Band, {
		background,
		children: [
			/* @__PURE__ */ jsx(SectionHead, {
				eyebrow: fields.eyebrow,
				heading: fields.heading,
				intro: fields.intro,
				dark
			}),
			/* @__PURE__ */ jsx("div", {
				"data-reveal": true,
				"data-reveal-stagger": true,
				className: `grid gap-8 ${gridCols[columns] ?? gridCols[3]}`,
				children: items.map((item, index) => /* @__PURE__ */ jsxs("article", {
					id: item.anchorId || void 0,
					className: `group overflow-hidden rounded-2xl border transition-all duration-300 ${span && index === 0 ? "lg:col-span-2" : ""} ${dark ? "border-white/10 bg-white/5 hover:border-[#f1d5a0]/40" : "border-[#84572f]/10 bg-white shadow-sm hover:shadow-xl"}`,
					children: [item.coverImage && /* @__PURE__ */ jsx("div", {
						className: "card-media aspect-[760/520] overflow-hidden",
						children: /* @__PURE__ */ jsx(Img, {
							image: item.coverImage,
							sizes: "(min-width: 1024px) 24rem, 100vw",
							decorative: true,
							className: "h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
						})
					}), /* @__PURE__ */ jsxs("div", {
						className: "p-6",
						children: [/* @__PURE__ */ jsx("h3", {
							className: `text-lg font-extrabold tracking-tight transition-colors ${dark ? "text-white group-hover:text-[#f1d5a0]" : "text-[#141615] group-hover:text-[#84572f]"}`,
							children: item.title
						}), (item.summary || item.excerpt || item.quote) && /* @__PURE__ */ jsx("p", {
							className: `mt-2 leading-relaxed ${dark ? "text-white/75" : "text-[#141615]/70"}`,
							children: item.summary || item.excerpt || item.quote
						})]
					})]
				}, item.id))
			}),
			fields.footer_cta && /* @__PURE__ */ jsx("div", {
				className: "mt-14 text-center",
				children: /* @__PURE__ */ jsx(Button, {
					to: fields.footer_cta.url,
					variant: dark ? "onDark" : "primary",
					children: fields.footer_cta.label
				})
			})
		]
	});
}
function StatRow({ section }) {
	const { fields, background } = section;
	const dark = isDark(background);
	const stats = fields.stats ?? [];
	return /* @__PURE__ */ jsxs(Band, {
		background,
		children: [(fields.eyebrow || fields.heading) && /* @__PURE__ */ jsx(SectionHead, {
			eyebrow: fields.eyebrow,
			heading: fields.heading,
			dark
		}), /* @__PURE__ */ jsx("dl", {
			"data-reveal": true,
			"data-reveal-stagger": true,
			className: "grid grid-cols-2 gap-4 sm:grid-cols-4",
			children: stats.map((stat, index) => /* @__PURE__ */ jsxs("div", {
				className: `rounded-2xl border p-6 text-center ${dark ? "border-white/10 bg-white/5" : "border-[#84572f]/10 bg-white shadow-sm"}`,
				children: [
					/* @__PURE__ */ jsx("dt", {
						className: "sr-only",
						children: stat.label
					}),
					/* @__PURE__ */ jsx("dd", {
						className: `font-mono text-2xl font-extrabold tabular-nums sm:text-3xl ${dark ? "text-[#f1d5a0]" : "text-[#84572f]"}`,
						children: stat.value
					}),
					/* @__PURE__ */ jsx("p", {
						className: `mt-1.5 text-sm ${dark ? "text-white/70" : "text-[#141615]/65"}`,
						"aria-hidden": "true",
						children: stat.label
					})
				]
			}, index))
		})]
	});
}
function TestimonialSet({ section }) {
	const { fields, background, resolved } = section;
	const dark = isDark(background);
	const items = resolved?.items_source ?? [];
	return /* @__PURE__ */ jsxs(Band, {
		background,
		children: [/* @__PURE__ */ jsx(SectionHead, {
			eyebrow: fields.eyebrow,
			heading: fields.heading,
			intro: fields.intro,
			dark
		}), /* @__PURE__ */ jsx("div", {
			"data-reveal": true,
			"data-reveal-stagger": true,
			className: "grid gap-8 md:grid-cols-2",
			children: items.map((item) => /* @__PURE__ */ jsxs("figure", {
				className: `flex flex-col rounded-2xl border p-7 ${dark ? "border-white/10 bg-white/5" : "border-[#84572f]/10 bg-white shadow-sm"}`,
				children: [/* @__PURE__ */ jsxs("blockquote", {
					className: `flex-1 text-lg leading-relaxed ${dark ? "text-white/85" : "text-[#141615]/80"}`,
					children: [
						"“",
						item.quote,
						"”"
					]
				}), /* @__PURE__ */ jsxs("figcaption", {
					className: `mt-5 border-t pt-4 text-sm ${dark ? "border-white/10 text-white/70" : "border-[#84572f]/10 text-[#141615]/65"}`,
					children: [
						/* @__PURE__ */ jsx("span", {
							className: "font-semibold",
							children: item.author
						}),
						item.role && /* @__PURE__ */ jsxs("span", { children: [" - ", item.role] }),
						item.company && /* @__PURE__ */ jsxs("span", { children: [", ", item.company] })
					]
				})]
			}, item.id))
		})]
	});
}
function CtaBand({ section }) {
	const { fields, background } = section;
	const dark = isDark(background);
	return /* @__PURE__ */ jsx("section", {
		className: `relative overflow-hidden py-24 md:py-32 ${dark ? "bg-[#0e100f] text-white" : "bg-[#f6f8f5]"}`,
		children: /* @__PURE__ */ jsxs("div", {
			"data-reveal": true,
			className: "relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8",
			children: [
				/* @__PURE__ */ jsx("h2", {
					className: `text-3xl font-extrabold tracking-tight text-balance sm:text-5xl ${dark ? "text-white" : "text-[#141615]"}`,
					children: fields.heading
				}),
				fields.body && /* @__PURE__ */ jsx("p", {
					className: `mx-auto mt-5 max-w-2xl text-lg leading-relaxed ${dark ? "text-white/80" : "text-[#141615]/75"}`,
					children: fields.body
				}),
				fields.primary_cta && /* @__PURE__ */ jsx("div", {
					className: "mt-9",
					children: /* @__PURE__ */ jsx(Button, {
						to: fields.primary_cta.url,
						variant: dark ? "onDark" : "primary",
						children: fields.primary_cta.label
					})
				})
			]
		})
	});
}
function CaseStudyGrid({ section }) {
	const { fields, background, resolved } = section;
	const dark = isDark(background);
	const items = resolved?.items_source ?? [];
	const categories = [...new Set(items.map((item) => item.category).filter(Boolean))];
	return /* @__PURE__ */ jsxs(Band, {
		background,
		children: [
			/* @__PURE__ */ jsx(SectionHead, {
				eyebrow: fields.eyebrow,
				heading: fields.heading,
				intro: fields.intro,
				dark
			}),
			fields.show_filters && categories.length > 1 && /* @__PURE__ */ jsx(CategoryFilter, {
				categories,
				items,
				dark,
				columns: fields.columns
			}),
			(!fields.show_filters || categories.length <= 1) && /* @__PURE__ */ jsx(CaseStudyCards, {
				items,
				dark,
				columns: fields.columns
			})
		]
	});
}
/**
* Filter chips over the case-study grid.
*
* Real buttons with `aria-pressed`, so the active filter is announced rather
* than only coloured in.
*/
function CategoryFilter({ categories, items, dark, columns }) {
	const [active, setActive] = useState("all");
	const shown = active === "all" ? items : items.filter((item) => item.category === active);
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("div", {
		className: "mb-10 flex flex-wrap justify-center gap-2",
		children: ["all", ...categories].map((category) => {
			const selected = active === category;
			return /* @__PURE__ */ jsx("button", {
				type: "button",
				onClick: () => setActive(category),
				"aria-pressed": selected,
				className: ["rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all", selected ? "bg-[#84572f] text-white" : dark ? "border border-white/15 bg-white/5 text-white/80 hover:bg-white/10" : "border border-[#84572f]/15 bg-[#92ada4]/15 text-[#141615] hover:bg-[#92ada4]/25"].join(" "),
				children: category === "all" ? "All work" : category
			}, category);
		})
	}), /* @__PURE__ */ jsx(CaseStudyCards, {
		items: shown,
		dark,
		columns
	})] });
}
function CaseStudyCards({ items, dark, columns = "3" }) {
	if (items.length === 0) return /* @__PURE__ */ jsx("p", {
		className: `py-16 text-center ${dark ? "text-white/70" : "text-[#141615]/60"}`,
		children: "Nothing to show here yet."
	});
	return /* @__PURE__ */ jsx("div", {
		"data-reveal": true,
		"data-reveal-stagger": true,
		className: `grid gap-8 ${columns === "2" ? "md:grid-cols-2" : "md:grid-cols-2 lg:grid-cols-3"}`,
		children: items.map((item) => /* @__PURE__ */ jsxs("article", {
			className: `group overflow-hidden rounded-2xl border transition-all duration-300 ${dark ? "border-white/10 bg-white/5 hover:border-[#f1d5a0]/40" : "border-[#84572f]/10 bg-white shadow-sm hover:shadow-xl"}`,
			children: [item.coverImage && /* @__PURE__ */ jsx("div", {
				className: "card-media aspect-[760/520] overflow-hidden",
				children: /* @__PURE__ */ jsx(Img, {
					image: item.coverImage,
					sizes: "(min-width: 1024px) 24rem, 100vw",
					decorative: true,
					className: "h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
				})
			}), /* @__PURE__ */ jsxs("div", {
				className: "p-6",
				children: [
					item.client && /* @__PURE__ */ jsx("p", {
						className: `font-mono text-xs tracking-wider uppercase ${dark ? "text-[#f1d5a0]" : "text-[#84572f]"}`,
						children: item.client
					}),
					/* @__PURE__ */ jsx("h3", {
						className: `mt-1.5 text-lg font-extrabold tracking-tight transition-colors ${dark ? "text-white group-hover:text-[#f1d5a0]" : "text-[#141615] group-hover:text-[#84572f]"}`,
						children: /* @__PURE__ */ jsx(Link, {
							to: `/our-work/${item.slug}/`,
							className: "no-underline",
							children: item.title
						})
					}),
					item.summary && /* @__PURE__ */ jsx("p", {
						className: `mt-2 leading-relaxed ${dark ? "text-white/75" : "text-[#141615]/70"}`,
						children: item.summary
					}),
					item.metrics?.length > 0 && /* @__PURE__ */ jsx("dl", {
						className: "mt-5 flex flex-wrap gap-4 border-t border-current/10 pt-4",
						children: item.metrics.map((metric, index) => /* @__PURE__ */ jsxs("div", { children: [
							/* @__PURE__ */ jsx("dt", {
								className: "sr-only",
								children: metric.label
							}),
							/* @__PURE__ */ jsx("dd", {
								className: `font-mono text-lg font-extrabold tabular-nums ${dark ? "text-[#f1d5a0]" : "text-[#84572f]"}`,
								children: metric.value
							}),
							/* @__PURE__ */ jsx("p", {
								className: `text-xs ${dark ? "text-white/60" : "text-[#141615]/55"}`,
								"aria-hidden": "true",
								children: metric.label
							})
						] }, index))
					})
				]
			})]
		}, item.id))
	});
}
/**
* The map the renderer uses. A section type with no entry renders nothing
* rather than crashing the page.
*/
var SECTION_COMPONENTS = {
	hero: Hero,
	rich_text: RichText,
	feature_list: FeatureList,
	intro_grid: IntroGrid,
	stat_row: StatRow,
	testimonial_set: TestimonialSet,
	cta_band: CtaBand,
	case_study_grid: CaseStudyGrid
};
//#endregion
//#region src/components/CaseStudy.jsx
/**
* A single case study.
*
* The grid cards only ever showed a summary and the headline metrics, which
* left `objective` and `approach` written into the CMS and rendered nowhere.
* This is the page that content was always for.
*/
function CaseStudy({ study, others }) {
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx("header", {
			className: "border-b border-[#84572f]/10 bg-[#fcf5e9] py-20 md:py-28",
			children: /* @__PURE__ */ jsxs("div", {
				className: "mx-auto max-w-4xl px-4 sm:px-6 lg:px-8",
				children: [/* @__PURE__ */ jsx(Link, {
					to: "/our-work/",
					className: "link-underline mb-8 inline-block text-sm text-[#141615]/60 transition-colors hover:text-[#84572f]",
					children: "All work"
				}), /* @__PURE__ */ jsxs("div", {
					"data-reveal": true,
					children: [
						study.client && /* @__PURE__ */ jsx("p", {
							className: "font-mono text-xs tracking-wider text-[#84572f] uppercase",
							children: study.client
						}),
						/* @__PURE__ */ jsx("h1", {
							className: "mt-3 text-4xl leading-[1.08] font-extrabold tracking-tight text-balance text-[#141615] sm:text-5xl lg:text-6xl",
							children: study.title
						}),
						study.summary && /* @__PURE__ */ jsx("p", {
							className: "mt-6 max-w-2xl text-lg leading-relaxed text-[#141615]/75",
							children: study.summary
						}),
						study.category && /* @__PURE__ */ jsx("p", {
							className: "mt-6",
							children: /* @__PURE__ */ jsx("span", {
								className: "inline-flex rounded-full border border-[#84572f]/15 bg-[#92ada4]/15 px-3.5 py-1.5 font-mono text-xs font-semibold tracking-wider text-[#141615] uppercase",
								children: study.category
							})
						})
					]
				})]
			})
		}),
		study.coverImage?.url && /* @__PURE__ */ jsx("div", {
			className: "bg-[#fcf5e9]",
			children: /* @__PURE__ */ jsx("div", {
				className: "mx-auto max-w-5xl px-4 sm:px-6 lg:px-8",
				children: /* @__PURE__ */ jsx("img", {
					src: study.coverImage.url,
					srcSet: study.coverImage.srcset || void 0,
					sizes: "(min-width: 1024px) 64rem, 100vw",
					alt: study.coverImage.alt ?? "",
					width: study.coverImage.width || void 0,
					height: study.coverImage.height || void 0,
					className: "w-full rounded-2xl"
				})
			})
		}),
		study.metrics?.length > 0 && /* @__PURE__ */ jsx("section", {
			className: "border-b border-white/10 bg-[#141615] py-16 text-white md:py-20",
			children: /* @__PURE__ */ jsxs("div", {
				className: "mx-auto max-w-5xl px-4 sm:px-6 lg:px-8",
				children: [/* @__PURE__ */ jsx("p", {
					className: "mb-8 text-center font-mono text-xs font-semibold tracking-wider text-[#f1d5a0] uppercase",
					children: "Verified performance data"
				}), /* @__PURE__ */ jsx("dl", {
					"data-reveal": true,
					"data-reveal-stagger": true,
					className: "grid grid-cols-2 gap-6 sm:grid-cols-3",
					children: study.metrics.map((metric, index) => /* @__PURE__ */ jsxs("div", {
						className: "text-center",
						children: [
							/* @__PURE__ */ jsx("dt", {
								className: "sr-only",
								children: metric.label
							}),
							/* @__PURE__ */ jsx("dd", {
								className: "font-mono text-3xl font-extrabold tabular-nums text-[#f1d5a0] sm:text-4xl",
								children: /* @__PURE__ */ jsx(CountUp, { value: metric.value })
							}),
							/* @__PURE__ */ jsx("p", {
								className: "mt-2 text-sm text-white/70",
								"aria-hidden": "true",
								children: metric.label
							})
						]
					}, index))
				})]
			})
		}),
		(study.objective || study.approach) && /* @__PURE__ */ jsx("section", {
			className: "border-b border-[#84572f]/10 bg-[#f6f8f5] py-20 md:py-28",
			children: /* @__PURE__ */ jsxs("div", {
				className: "mx-auto grid max-w-5xl gap-12 px-4 sm:px-6 md:grid-cols-2 lg:px-8",
				children: [study.objective && /* @__PURE__ */ jsxs("div", {
					"data-reveal": true,
					children: [/* @__PURE__ */ jsx("h2", {
						className: "mb-4 font-mono text-xs font-semibold tracking-wider text-[#84572f] uppercase",
						children: "The objective"
					}), /* @__PURE__ */ jsx("p", {
						className: "text-lg leading-relaxed text-[#141615]/80",
						children: study.objective
					})]
				}), study.approach && /* @__PURE__ */ jsxs("div", {
					"data-reveal": true,
					children: [/* @__PURE__ */ jsx("h2", {
						className: "mb-4 font-mono text-xs font-semibold tracking-wider text-[#84572f] uppercase",
						children: "Our approach"
					}), /* @__PURE__ */ jsx("p", {
						className: "text-lg leading-relaxed text-[#141615]/80",
						children: study.approach
					})]
				})]
			})
		}),
		study.deliverables?.length > 0 && /* @__PURE__ */ jsx("section", {
			className: "border-b border-[#84572f]/10 bg-[#fcf5e9] py-20 md:py-28",
			children: /* @__PURE__ */ jsxs("div", {
				className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "mb-14 text-center text-3xl font-extrabold tracking-tight text-[#141615] sm:text-4xl",
					children: "Creative deliverables"
				}), /* @__PURE__ */ jsx("div", {
					"data-reveal": true,
					"data-reveal-stagger": true,
					className: "grid gap-8 md:grid-cols-2 lg:grid-cols-3",
					children: study.deliverables.map((item, index) => /* @__PURE__ */ jsxs("article", {
						className: "group overflow-hidden rounded-2xl border border-[#84572f]/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
						children: [item.image?.url && /* @__PURE__ */ jsx("div", {
							className: "aspect-[760/520] overflow-hidden",
							children: /* @__PURE__ */ jsx("img", {
								src: item.image.url,
								alt: "",
								loading: "lazy",
								width: item.image.width || void 0,
								height: item.image.height || void 0,
								className: "h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
							})
						}), /* @__PURE__ */ jsxs("div", {
							className: "p-6",
							children: [/* @__PURE__ */ jsx("h3", {
								className: "text-lg font-extrabold tracking-tight text-[#141615]",
								children: item.title
							}), item.body && /* @__PURE__ */ jsx("p", {
								className: "mt-2 leading-relaxed text-[#141615]/70",
								children: item.body
							})]
						})]
					}, index))
				})]
			})
		}),
		study.gallery?.length > 0 && /* @__PURE__ */ jsx("section", {
			className: "border-b border-[#84572f]/10 bg-[#f6f8f5] py-20 md:py-28",
			children: /* @__PURE__ */ jsx("div", {
				className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
				children: /* @__PURE__ */ jsx("ul", {
					"data-reveal": true,
					"data-reveal-stagger": true,
					className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
					children: study.gallery.map((image, index) => /* @__PURE__ */ jsx("li", {
						className: "overflow-hidden rounded-2xl",
						children: /* @__PURE__ */ jsx("img", {
							src: image.url,
							alt: image.alt ?? "",
							loading: "lazy",
							width: image.width || void 0,
							height: image.height || void 0,
							className: "h-full w-full object-cover transition-transform duration-700 hover:scale-105"
						})
					}, index))
				})
			})
		}),
		others?.length > 0 && /* @__PURE__ */ jsx("section", {
			className: "bg-[#fcf5e9] py-20 md:py-28",
			children: /* @__PURE__ */ jsxs("div", {
				className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "mb-12 text-2xl font-extrabold tracking-tight text-[#141615]",
					children: "More work"
				}), /* @__PURE__ */ jsx("div", {
					"data-reveal": true,
					"data-reveal-stagger": true,
					className: "grid gap-8 md:grid-cols-3",
					children: others.map((other) => /* @__PURE__ */ jsxs(Link, {
						to: `/our-work/${other.slug}/`,
						className: "group block rounded-2xl border border-[#84572f]/10 bg-white p-6 no-underline shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
						children: [other.client && /* @__PURE__ */ jsx("span", {
							className: "font-mono text-xs tracking-wider text-[#84572f] uppercase",
							children: other.client
						}), /* @__PURE__ */ jsx("span", {
							className: "mt-1.5 block text-lg font-extrabold tracking-tight text-[#141615] transition-colors group-hover:text-[#84572f]",
							children: other.title
						})]
					}, other.id))
				})]
			})
		}),
		/* @__PURE__ */ jsx("section", {
			className: "bg-[#0e100f] py-24 text-white md:py-32",
			children: /* @__PURE__ */ jsxs("div", {
				className: "mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "text-3xl font-extrabold tracking-tight text-balance sm:text-5xl",
					children: "Want results like these?"
				}), /* @__PURE__ */ jsx("div", {
					className: "mt-9",
					children: /* @__PURE__ */ jsx(Button, {
						to: "/contact-us/",
						variant: "onDark",
						children: "Get in touch"
					})
				})]
			})
		})
	] });
}
/**
* Counts a metric up when it first comes into view.
*
* Motivated, not decorative: on a case study the numbers are the evidence, and
* movement puts the eye on them. It only runs once, and only for values it can
* parse, so "3.2x" and "+631" animate while anything unexpected is printed
* as-is rather than mangled.
*/
function CountUp({ value }) {
	const ref = useRef(null);
	const [display, setDisplay] = useState(value);
	useEffect(() => {
		const node = ref.current;
		if (!node || typeof window === "undefined") return;
		if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const match = String(value).match(/^([^\d.]*)([\d.]+)(.*)$/);
		if (!match || !("IntersectionObserver" in window)) return;
		const [, prefix, numberText, suffix] = match;
		const target = parseFloat(numberText);
		const decimals = (numberText.split(".")[1] ?? "").length;
		if (!Number.isFinite(target)) return;
		let frame = 0;
		let start = 0;
		const observer = new IntersectionObserver((entries) => {
			if (!entries[0].isIntersecting) return;
			observer.disconnect();
			const step = (now) => {
				if (!start) start = now;
				const progress = Math.min((now - start) / 900, 1);
				const eased = 1 - Math.pow(1 - progress, 3);
				setDisplay(`${prefix}${(target * eased).toFixed(decimals)}${suffix}`);
				if (progress < 1) frame = requestAnimationFrame(step);
			};
			frame = requestAnimationFrame(step);
		}, { threshold: .4 });
		observer.observe(node);
		return () => {
			observer.disconnect();
			cancelAnimationFrame(frame);
		};
	}, [value]);
	return /* @__PURE__ */ jsxs("span", {
		ref,
		children: [/* @__PURE__ */ jsx("span", {
			"aria-hidden": "true",
			children: display
		}), /* @__PURE__ */ jsx("span", {
			className: "sr-only",
			children: value
		})]
	});
}
//#endregion
//#region src/App.jsx
/**
* The public site.
*
* Everything renders from one `/snapshot` payload. When the page was
* prerendered, that payload is already embedded in the HTML, so the first paint
* needs no network at all.
*/
/**
* Reads the snapshot the prerender step inlined, if there is one.
*/
function initialSnapshot() {
	if (typeof window === "undefined") return null;
	return window.__BPS_SNAPSHOT__ ?? readCachedSnapshot();
}
function App({ snapshot: provided, initialPath = "/" }) {
	const [snapshot, setSnapshot] = useState(() => provided ?? initialSnapshot());
	const [error, setError] = useState(null);
	useEffect(() => {
		if (snapshot) return;
		const controller = new AbortController();
		fetchSnapshot(controller.signal).then((data) => {
			cacheSnapshot(data);
			setSnapshot(data);
		}).catch((caught) => {
			if (caught.name !== "AbortError") setError(caught);
		});
		return () => controller.abort();
	}, [snapshot]);
	if (error) return /* @__PURE__ */ jsxs("main", {
		role: "alert",
		className: "mx-auto flex min-h-[100dvh] max-w-xl flex-col justify-center px-6 text-center",
		children: [
			/* @__PURE__ */ jsx("h1", {
				className: "text-2xl font-extrabold tracking-tight",
				children: "This site is not loading"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-3 leading-relaxed text-[#141615]/70",
				children: error.message
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-8",
				children: /* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: () => window.location.reload(),
					className: "inline-flex rounded-full bg-[#84572f] px-6 py-3 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-[#6c4625]",
					children: "Try again"
				})
			})
		]
	});
	if (!snapshot) return /* @__PURE__ */ jsx(Loading, {});
	return /* @__PURE__ */ jsx(RouterProvider, {
		initialPath,
		children: /* @__PURE__ */ jsx(Site, {
			snapshot,
			fromNetwork: !provided && !initialSnapshot()
		})
	});
}
function Site({ snapshot, fromNetwork = false }) {
	const { path } = useRouter();
	const nav = useMemo(() => buildNav(snapshot), [snapshot]);
	const view = useMemo(() => resolve(path, snapshot), [path, snapshot]);
	useEffect(() => initReveal(), []);
	useEffect(() => initMagnetic(), []);
	useEffect(() => {
		if (typeof document === "undefined") return;
		document.title = view.title;
		setMeta("description", view.description);
	}, [view]);
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		/* @__PURE__ */ jsx(SkipLink, {}),
		(path.startsWith("/blog/") || path.startsWith("/our-work/")) && path !== "/blog/" && path !== "/our-work/" && supportsScrollTimeline() && /* @__PURE__ */ jsx("div", {
			className: "read-progress",
			"aria-hidden": "true"
		}),
		/* @__PURE__ */ jsx(Header, {
			nav,
			branding: snapshot.settings
		}),
		/* @__PURE__ */ jsx("main", {
			id: "main",
			tabIndex: -1,
			className: fromNetwork ? "content-enter" : void 0,
			children: view.element
		}),
		/* @__PURE__ */ jsx(Footer, {
			nav,
			branding: snapshot.settings
		})
	] });
}
/**
* Nav entries, in the order the editor arranged the pages.
*/
function buildNav(snapshot) {
	return Object.values(snapshot.pages ?? {}).filter((page) => page.route !== "").map((page) => ({
		id: page.id,
		label: page.title,
		path: `/${page.route}/`
	}));
}
/**
* Picks what to render for a path.
*/
function resolve(path, snapshot) {
	const posts = snapshot.collections?.post ?? [];
	const postMatch = path.match(/^\/blog\/([^/]+)\/$/);
	if (postMatch) {
		const post = posts.find((entry) => entry.slug === postMatch[1]);
		if (post) return {
			title: `${post.title} | Breakpoint Social`,
			description: post.excerpt ?? "",
			element: /* @__PURE__ */ jsx(BlogPost, { post })
		};
	}
	const studyMatch = path.match(/^\/our-work\/([^/]+)\/$/);
	if (studyMatch) {
		const studies = snapshot.collections?.case_study ?? [];
		const study = studies.find((entry) => entry.slug === studyMatch[1]);
		if (study) return {
			title: `${study.title} | Breakpoint Social`,
			description: study.summary ?? "",
			element: /* @__PURE__ */ jsx(CaseStudy, {
				study,
				others: studies.filter((entry) => entry.id !== study.id).slice(0, 3)
			})
		};
	}
	const route = path === "/" ? "" : path.replace(/^\/|\/$/g, "");
	const page = snapshot.pages?.[route];
	if (page) {
		const seoTitle = page.seo?.title ?? "";
		const hasCustomTitle = seoTitle !== "" && seoTitle !== page.title;
		const name = hasCustomTitle ? seoTitle : page.title;
		return {
			title: route === "" ? hasCustomTitle ? seoTitle : "Breakpoint Social | San Diego Social Media Agency" : `${name} | Breakpoint Social`,
			description: page.seo?.description ?? "",
			element: /* @__PURE__ */ jsx(Page, {
				page,
				posts
			})
		};
	}
	return {
		title: "Not found | Breakpoint Social",
		description: "",
		element: /* @__PURE__ */ jsx(NotFound, {})
	};
}
/**
* Renders a page's section tree.
*/
function Page({ page, posts }) {
	const sections = page.sections ?? [];
	const isBlogIndex = page.route === "blog";
	return /* @__PURE__ */ jsxs(Fragment, { children: [
		sections.map((section) => {
			if (section.type === "contact_form") return /* @__PURE__ */ jsx(ContactSection, { section }, section.id);
			const Component = SECTION_COMPONENTS[section.type];
			if (!Component) return null;
			return /* @__PURE__ */ jsx(Component, { section }, section.id);
		}),
		isBlogIndex && /* @__PURE__ */ jsx(BlogList, {
			posts,
			bare: sections.length === 0
		}),
		sections.length === 0 && !isBlogIndex && /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-2xl px-6 py-32 text-center",
			children: [/* @__PURE__ */ jsx("h1", {
				className: "text-3xl font-extrabold tracking-tight",
				children: page.title
			}), /* @__PURE__ */ jsx("p", {
				className: "mt-4 leading-relaxed text-[#141615]/70",
				children: "This page has not been written yet."
			})]
		})
	] });
}
function ContactSection({ section }) {
	const { fields } = section;
	return /* @__PURE__ */ jsx("section", {
		className: "border-b border-[#84572f]/10 bg-[#f6f8f5] py-20 md:py-28",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "mx-auto mb-14 max-w-3xl text-center md:mb-20",
				children: [
					fields.eyebrow && /* @__PURE__ */ jsx("span", {
						className: "mb-4 inline-flex rounded-full border border-[#84572f]/15 bg-[#92ada4]/15 px-3.5 py-1.5 font-mono text-xs font-semibold tracking-wider text-[#141615] uppercase",
						children: fields.eyebrow
					}),
					/* @__PURE__ */ jsx("h2", {
						className: "text-3xl font-extrabold tracking-tight text-balance text-[#141615] sm:text-5xl",
						children: fields.heading
					}),
					fields.intro && /* @__PURE__ */ jsx("p", {
						className: "mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-[#141615]/75",
						children: fields.intro
					})
				]
			}), /* @__PURE__ */ jsx(ContactForm, {
				submitLabel: fields.submit_label || "Submit",
				successTitle: fields.success_title,
				successBody: fields.success_body
			})]
		})
	});
}
function BlogList({ posts, bare }) {
	return /* @__PURE__ */ jsx("section", {
		className: `${bare ? "py-20 md:py-28" : "pb-20 md:pb-28"} bg-[#fcf5e9]`,
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8",
			children: [bare && /* @__PURE__ */ jsx("div", {
				className: "mx-auto mb-14 max-w-3xl text-center md:mb-20",
				children: /* @__PURE__ */ jsx("h1", {
					className: "text-4xl font-extrabold tracking-tight text-[#141615] sm:text-5xl",
					children: "Blog"
				})
			}), posts.length === 0 ? /* @__PURE__ */ jsx("p", {
				className: "py-16 text-center text-[#141615]/60",
				children: "No posts yet."
			}) : /* @__PURE__ */ jsx("div", {
				"data-reveal": true,
				"data-reveal-stagger": true,
				className: "grid gap-8 md:grid-cols-2 lg:grid-cols-3",
				children: posts.map((post) => /* @__PURE__ */ jsxs("article", {
					className: "group overflow-hidden rounded-2xl border border-[#84572f]/10 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl",
					children: [post.coverImage?.url && /* @__PURE__ */ jsx(Link, {
						to: `/blog/${post.slug}/`,
						className: "block aspect-[760/520] overflow-hidden",
						children: /* @__PURE__ */ jsx("img", {
							src: post.coverImage.url,
							srcSet: post.coverImage.srcset || void 0,
							sizes: "(min-width: 1024px) 24rem, 100vw",
							alt: post.coverImage.alt ?? "",
							loading: "lazy",
							className: "h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
						})
					}), /* @__PURE__ */ jsxs("div", {
						className: "p-6",
						children: [
							post.publishedAt && /* @__PURE__ */ jsx("time", {
								dateTime: post.publishedAt,
								className: "font-mono text-xs tracking-wider text-[#84572f] uppercase",
								children: formatDate(post.publishedAt)
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "mt-2 text-lg font-extrabold tracking-tight text-[#141615]",
								children: /* @__PURE__ */ jsx(Link, {
									to: `/blog/${post.slug}/`,
									className: "transition-colors group-hover:text-[#84572f]",
									children: post.title
								})
							}),
							post.excerpt && /* @__PURE__ */ jsx("p", {
								className: "mt-2 leading-relaxed text-[#141615]/70",
								children: post.excerpt
							})
						]
					})]
				}, post.id))
			})]
		})
	});
}
function BlogPost({ post }) {
	return /* @__PURE__ */ jsx("article", {
		className: "bg-[#fcf5e9] py-20 md:py-28",
		children: /* @__PURE__ */ jsxs("div", {
			className: "mx-auto max-w-3xl px-4 sm:px-6 lg:px-8",
			children: [
				/* @__PURE__ */ jsx(Link, {
					to: "/blog/",
					className: "mb-8 inline-block text-sm text-[#141615]/60 transition-colors hover:text-[#84572f]",
					children: "Back to all posts"
				}),
				/* @__PURE__ */ jsxs("header", {
					className: "mb-10",
					children: [
						post.publishedAt && /* @__PURE__ */ jsx("time", {
							dateTime: post.publishedAt,
							className: "font-mono text-xs tracking-wider text-[#84572f] uppercase",
							children: formatDate(post.publishedAt)
						}),
						/* @__PURE__ */ jsx("h1", {
							className: "mt-3 text-4xl leading-[1.1] font-extrabold tracking-tight text-balance text-[#141615] sm:text-5xl",
							children: post.title
						}),
						post.excerpt && /* @__PURE__ */ jsx("p", {
							className: "mt-5 text-lg leading-relaxed text-[#141615]/75",
							children: post.excerpt
						})
					]
				}),
				post.coverImage?.url && /* @__PURE__ */ jsx("img", {
					src: post.coverImage.url,
					srcSet: post.coverImage.srcset || void 0,
					sizes: "(min-width: 768px) 48rem, 100vw",
					alt: post.coverImage.alt ?? "",
					className: "mb-10 w-full rounded-2xl"
				}),
				/* @__PURE__ */ jsx("div", {
					className: "prose-bps text-[#141615]/85",
					dangerouslySetInnerHTML: { __html: fixHeadingLevels(post.body ?? "", true) }
				})
			]
		})
	});
}
function NotFound() {
	return /* @__PURE__ */ jsxs("div", {
		className: "mx-auto flex min-h-[60vh] max-w-xl flex-col justify-center px-6 text-center",
		children: [
			/* @__PURE__ */ jsx("p", {
				className: "font-mono text-xs tracking-wider text-[#84572f] uppercase",
				children: "404"
			}),
			/* @__PURE__ */ jsx("h1", {
				className: "mt-3 text-3xl font-extrabold tracking-tight text-[#141615]",
				children: "That page does not exist"
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-4 leading-relaxed text-[#141615]/70",
				children: "The link may be out of date."
			}),
			/* @__PURE__ */ jsx("p", {
				className: "mt-8",
				children: /* @__PURE__ */ jsx(Link, {
					to: "/",
					className: "inline-flex rounded-full bg-[#84572f] px-6 py-3 text-xs font-semibold tracking-wider text-white uppercase transition-colors hover:bg-[#6c4625]",
					children: "Back to the homepage"
				})
			})
		]
	});
}
function formatDate(iso) {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return "";
	return date.toLocaleDateString("en-US", {
		day: "numeric",
		month: "long",
		year: "numeric"
	});
}
function setMeta(name, content) {
	let tag = document.querySelector(`meta[name="${name}"]`);
	if (!tag) {
		tag = document.createElement("meta");
		tag.setAttribute("name", name);
		document.head.appendChild(tag);
	}
	tag.setAttribute("content", content ?? "");
}
//#endregion
//#region src/entry-server.jsx
/**
* Server entry for the prerender step.
*
* Built by Vite with `--ssr`, which transforms the JSX that Node cannot parse
* on its own and resolves the same module graph the browser bundle uses. That
* shared graph is the point: the static HTML and the hydrated page come from
* one source, so they cannot drift.
*/
function render(snapshot, route) {
	return renderToString(/* @__PURE__ */ jsx(App, {
		snapshot,
		initialPath: route
	}));
}
//#endregion
export { render };

//# sourceMappingURL=entry-server.js.map