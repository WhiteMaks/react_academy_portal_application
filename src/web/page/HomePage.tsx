import React, {FC, useCallback, useEffect, useState} from "react";
import {Outlet, useLocation} from "react-router-dom";
import AdminSidebar from "../component/app_shell/AdminSidebar";
import AdminTopbar from "../component/app_shell/AdminTopbar";
import {ShellChromeProvider} from "../component/app_shell/ShellChromeContext";

const HomePage: FC = () => {
	const {pathname} = useLocation();
	const [navOpen, setNavOpen] = useState(false);

	const closeNav = useCallback(() => setNavOpen(false), []);
	const toggleNav = useCallback(() => setNavOpen(open => !open), []);

	useEffect(() => {
		closeNav();
	}, [pathname, closeNav]);

	useEffect(() => {
		const body = document.body;
		if (navOpen) {
			body.classList.add("academy-app--nav-open");
		} else {
			body.classList.remove("academy-app--nav-open");
		}
		return () => body.classList.remove("academy-app--nav-open");
	}, [navOpen]);

	useEffect(() => {
		document.body.classList.add("academy-app");
		return () => document.body.classList.remove("academy-app");
	}, []);

	return (
		<ShellChromeProvider>
			<div className="academy-app">
				<AdminSidebar onNavigate={closeNav}/>
				<main className="academy-app__main" id="main-content">
					<AdminTopbar pathname={pathname} navOpen={navOpen} onToggleNav={toggleNav}/>
					<div className="academy-app__content">
						<Outlet/>
					</div>
				</main>
				<button
					type="button"
					className="academy-app__nav-backdrop"
					id="app-nav-backdrop"
					hidden={!navOpen}
					aria-label="Закрыть меню навигации"
					onClick={closeNav}
				/>
			</div>
		</ShellChromeProvider>
	);
};

export default HomePage;