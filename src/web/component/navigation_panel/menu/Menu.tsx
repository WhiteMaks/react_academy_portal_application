import {FC} from "react";
import Block from "../../common/block/Block";
import style from "./Menu.module.css";
import {NavLink} from "react-router-dom";
import SvgIcon from "../../common/svg_icon/SvgIcon";
import svg_dashboard from "../../../../img/svg/dashboard.svg";
import svg_calendar from "../../../../img/svg/calendar.svg";
import svg_group from "../../../../img/svg/group.svg";
import svg_couch from "../../../../img/svg/couch.svg";
import svg_athlete from "../../../../img/svg/athlete.svg";
import svg_gym from "../../../../img/svg/gym.svg";
import svg_event from "../../../../img/svg/event.svg";
import svg_logout from "../../../../img/svg/logout.svg";

const routes = [
	{path: "/", value: "Dashboard", svg: svg_dashboard},
	{path: "/calendar", value: "Календарь", svg: svg_calendar},
	{path: "/groups", value: "Группы", svg: svg_group},
	{path: "/couches", value: "Тренеры", svg: svg_couch},
	{path: "/athletes", value: "Спортсмены", svg: svg_athlete},
	{path: "/gyms", value: "Спортзалы", svg: svg_gym},
	{path: "/events", value: "События", svg: svg_event},
];

const Menu: FC = () => {

	return (
		<Block className={style.content}>
			<nav>
				{
					routes.map(
						route =>
							<NavLink key={route.value} className={({isActive}) => isActive ? style.active : undefined} to={route.path} end>
								<Block className={style.block}>
									<SvgIcon description={route.value} iconPath={route.svg}/>
									<Block>{route.value}</Block>
								</Block>
							</NavLink>
					)
				}
			</nav>
			<NavLink className={({isActive}) => isActive ? style.active : undefined} to={"/logout"} end>
				<Block className={style.block}>
					<SvgIcon description={"logout"} iconPath={svg_logout}/>
					<Block>{"Выйти"}</Block>
				</Block>
			</NavLink>
		</Block>
	);
}

export default Menu;