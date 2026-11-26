import React, {FC} from "react";
import {Link, useLocation} from "react-router-dom";
import {ADMIN_NAV_ITEMS} from "./adminNavConfig";

interface AdminSidebarProps {
	id?: string;
	onNavigate?: () => void;
}

const AdminSidebar: FC<AdminSidebarProps> = ({id = "app-sidebar", onNavigate}) => {
	const {pathname} = useLocation();

	return (
		<aside className="academy-app__sidebar" id={id} aria-label="Навигация по разделам">
			<div className="academy-app__brand">
				<img
					className="academy-app__logo"
					src={`${process.env.PUBLIC_URL}/brand/club-logo.png`}
					alt="Логотип Академии Единоборств"
				/>
				<div className="academy-app__brand-text">
					<strong>
						АКАДЕМИЯ
						<br/>
						ЕДИНОБОРСТВ
					</strong>
					<small>СИСТЕМА УПРАВЛЕНИЯ</small>
				</div>
			</div>
			<nav className="sidebar-nav" aria-label="Разделы">
				{ADMIN_NAV_ITEMS.map(item => {
					const active = item.match(pathname);
					return (
						<Link
							key={item.path}
							className={`sidebar-nav__item${active ? " sidebar-nav__item--active" : ""}`}
							to={item.path}
							aria-current={active ? "page" : undefined}
							onClick={onNavigate}
						>
							<span className="sidebar-nav__icon" aria-hidden="true">{item.icon}</span>
							{item.label}
						</Link>
					);
				})}
			</nav>
			<p className="academy-app__side-foot">
				Клуб: <b>Академия Единоборств</b>
				<br/>
				Саранск · Васенко, 9/2
			</p>
		</aside>
	);
};

export default AdminSidebar;