import {FC} from "react";
import style from "./NavigationPanel.module.css";
import Project from "./project/Project";
import Block from "../common/block/Block";
import Menu from "./menu/Menu";

const NavigationPanel: FC = () => {

	return (
		<Block className={style.content}>
			<Project name={"Академия единоборств"}/>
			<Menu/>
		</Block>
	);

}

export default NavigationPanel;