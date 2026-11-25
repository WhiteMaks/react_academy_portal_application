import React, {FC} from "react";
import {Link, Outlet} from "react-router-dom";
import style from "./AppShell.module.css";

const HomePage: FC = () => (
	<div className={style.shell}>
		<header className={style.header}>
			<span className={style.brand}>АКАДЕМИЯ ЕДИНОБОРСТВ</span>
			<Link className={style.logout} to="/logout">
				Выйти
			</Link>
		</header>
		<main className={style.main}>
			<Outlet/>
		</main>
	</div>
);

export default HomePage;