import {FC, useEffect, useRef, useState} from "react";
import style from "./NavigationPanel.module.css";
import Project from "./project/Project";
import Block from "../common/block/Block";
import Menu from "./menu/Menu";

const NavigationPanel: FC = () => {
	const [mobileOpen, setMobileOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const closeRef = useRef<HTMLButtonElement>(null);
	const overlayRef = useRef<HTMLDivElement>(null);
	const wasOpen = useRef(false);

	useEffect(() => {
		if (mobileOpen) {
			closeRef.current?.focus();
		} else if (wasOpen.current) {
			triggerRef.current?.focus();
		}
		wasOpen.current = mobileOpen;
	}, [mobileOpen]);

	useEffect(() => {
		if (!mobileOpen) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				event.preventDefault();
				setMobileOpen(false);
				return;
			}
			if (event.key === "Tab") {
				const controls = Array.from(overlayRef.current?.querySelectorAll<HTMLElement>("button, a") ?? []);
				const first = controls[0];
				const last = controls[controls.length - 1];
				if (event.shiftKey && document.activeElement === first) {
					event.preventDefault();
					last?.focus();
				} else if (!event.shiftKey && document.activeElement === last) {
					event.preventDefault();
					first?.focus();
				}
			}
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [mobileOpen]);

	return (
		<Block className={style.content}>
			<div className={style.desktopContent}>
				<Project name="Академия единоборств"/>
				<Menu/>
			</div>
			<button
				ref={triggerRef}
				className={style.menuTrigger}
				type="button"
				aria-expanded={mobileOpen}
				aria-controls="mobile-navigation"
				onClick={() => setMobileOpen(true)}
			>
				<span className={style.menuGlyph} aria-hidden="true">☰</span>
				Меню
			</button>
			{mobileOpen && (
				<div ref={overlayRef} className={style.mobileOverlay} role="dialog" aria-modal="true" aria-label="Меню разделов">
					<div className={style.mobileHeader}>
						<Project name="Академия единоборств"/>
						<button ref={closeRef} className={style.closeButton} type="button" onClick={() => setMobileOpen(false)}>
							<span aria-hidden="true">×</span> Закрыть
						</button>
					</div>
					<div id="mobile-navigation" className={style.mobileContents}>
						<div className={style.sectionLabel}>Разделы</div>
						<Menu variant="mobile" onNavigate={() => setMobileOpen(false)}/>
					</div>
				</div>
			)}
		</Block>
	);
};

export default NavigationPanel;
