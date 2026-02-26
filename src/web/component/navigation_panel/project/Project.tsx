import {FC} from "react";
import style from "./Project.module.css"
import Block from "../../common/block/Block";
import SvgIcon from "../../common/svg_icon/SvgIcon";
import svg_logo from "../../../../img/svg/logo.svg";

interface ProjectProps {
	name: string;
}

const Project: FC<ProjectProps> = (props) => {

	return (
		<Block className={style.content}>
			<SvgIcon description={"logo"} iconPath={svg_logo}/>
		</Block>
	);

}

export default Project;