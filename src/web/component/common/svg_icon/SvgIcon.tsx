import {FC} from "react";

interface SvgIconProps {
	description: string;
	iconPath: string;
}

const SvgIcon: FC<SvgIconProps> = (props) => {

	return (
		<img alt={props.description} src={props.iconPath}/>
	);

}

export default SvgIcon;