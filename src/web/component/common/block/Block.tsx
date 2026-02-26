import {FC, ReactNode} from "react";

interface BlockProps {
	className?: string;
	children?: ReactNode | ReactNode[];
}

const Block: FC<BlockProps> = (props) => {

	return (
		<div className={props.className}>
			{props.children}
		</div>
	);

}

export default Block;