import {FC, ReactNode} from "react";
import style from "./ContentPanel.module.css";
import Block from "../common/block/Block";

interface BlockProps {
	children?: ReactNode | ReactNode[];
}

const ContentPanel: FC<BlockProps> = (props) => {

	return (
		<Block className={style.content}>
			{props.children}
		</Block>
	);

}

export default ContentPanel;