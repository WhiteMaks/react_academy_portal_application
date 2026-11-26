import React, {FC} from "react";
import {Link} from "react-router-dom";
import {resolveCrumbTitle} from "./adminNavConfig";
import {CrumbSegment, useShellChrome} from "./ShellChromeContext";

interface AdminTopbarProps {
	pathname: string;
	navOpen: boolean;
	onToggleNav: () => void;
}

const renderCrumb = (pathname: string, trail: CrumbSegment[] | null) => {
	if (trail && trail.length > 0) {
		return (
			<>
				Академия Единоборств <span aria-hidden="true"> / </span>
				{trail.map((segment, index) => {
					const isLast = index === trail.length - 1;
					return (
						<React.Fragment key={`${segment.label}-${index}`}>
							{segment.href && !isLast ? (
								<Link to={segment.href}>{segment.label}</Link>
							) : isLast ? (
								<b>{segment.label}</b>
							) : (
								<span>{segment.label}</span>
							)}
							{!isLast ? <> <span aria-hidden="true"> / </span> </> : null}
						</React.Fragment>
					);
				})}
			</>
		);
	}
	const title = resolveCrumbTitle(pathname);
	return (
		<>
			Академия Единоборств <span aria-hidden="true"> / </span> <b>{title}</b>
		</>
	);
};

const AdminTopbar: FC<AdminTopbarProps> = ({pathname, navOpen, onToggleNav}) => {
	const {mobileTitleOverride, crumbTrail} = useShellChrome();
	const mobileTitle = mobileTitleOverride ?? resolveCrumbTitle(pathname);

	return (
		<header className="academy-app__topbar">
			<div className="academy-app__topbar-start">
				<button
					type="button"
					className="academy-app__menu-toggle"
					id="app-menu-toggle"
					aria-controls="app-sidebar"
					aria-expanded={navOpen}
					aria-label="Открыть меню навигации"
					onClick={onToggleNav}
				>
					<span className="academy-app__menu-toggle-icon" aria-hidden="true"/>
				</button>
				<p className="academy-app__mobile-title">{mobileTitle}</p>
			</div>
			<p className="academy-app__crumb">{renderCrumb(pathname, crumbTrail)}</p>
			<div className="academy-app__top-right">
				<div className="academy-app__profile">
					<span className="academy-app__avatar" aria-hidden="true">АЕ</span>
					<span>Администратор</span>
				</div>
			</div>
		</header>
	);
};

export default AdminTopbar;