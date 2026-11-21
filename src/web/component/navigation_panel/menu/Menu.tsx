import {FC} from "react";
import Block from "../../common/block/Block";
import style from "./Menu.module.css";
import {NavLink} from "react-router-dom";
import SvgIcon from "../../common/svg_icon/SvgIcon";
import svg_dashboard from "../../../../img/svg/dashboard.svg";
import svg_calendar from "../../../../img/svg/calendar.svg";
import svg_card from "../../../../img/svg/card.svg";
import svg_group from "../../../../img/svg/group.svg";
import svg_couch from "../../../../img/svg/couch.svg";
import svg_athlete from "../../../../img/svg/athlete.svg";
import svg_logout from "../../../../img/svg/logout.svg";

interface MenuProps {
	variant?: "desktop" | "mobile";
	onNavigate?: () => void;
}

interface MenuRoute {
	path: string;
	value: string;
	svg: string;
	end: boolean;
}

const routes: MenuRoute[] = [
	{path: "/", value: "Сегодня", svg: svg_dashboard, end: true},
	{path: "/calendar", value: "Тренировки", svg: svg_calendar, end: true},
	{path: "/payments", value: "Оплата", svg: svg_card, end: true},
	{path: "/groups", value: "Группы", svg: svg_group, end: true},
	{path: "/couches", value: "Тренеры", svg: svg_couch, end: true},
	{path: "/athletes", value: "Спортсмены", svg: svg_athlete, end: true},
];

const Menu: FC<MenuProps> = ({variant = "desktop", onNavigate}) => (
	<Block className={variant === "mobile" ? style.mobileMenu : style.desktopMenu}>
		<nav aria-label="Основная навигация">
			{routes.map(route => (
				<NavLink
					key={route.path}
					to={route.path}
					end={route.end}
					className={({isActive}) => isActive ? style.active : undefined}
					onClick={onNavigate}
				>
					<Block className={style.item}>
						<SvgIcon description="" iconPath={route.svg}/>
						<span>{route.value}</span>
						{route.path !== "/" && <span className={style.status}>Скоро</span>}
					</Block>
				</NavLink>
			))}
		</nav>
		<NavLink
			className={({isActive}) => isActive ? `${style.logout} ${style.active}` : style.logout}
			to="/logout"
			onClick={onNavigate}
		>
			<Block className={style.item}>
				<SvgIcon description="" iconPath={svg_logout}/>
				<span>Выйти</span>
			</Block>
		</NavLink>
	</Block>
);

export default Menu;
