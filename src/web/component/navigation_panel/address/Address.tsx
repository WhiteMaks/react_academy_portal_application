import {FC} from "react";
import Block from "../../common/block/Block";
import style from "./Address.module.css";
import svg_point_on_map from "../../../../img/svg/point_on_map.svg";
import svg_arrow_down from "../../../../img/svg/arrow_down.svg";
import SvgIcon from "../../common/svg_icon/SvgIcon";

interface AddressProps {
	value: string;
}

const Address: FC<AddressProps> = (props) => {

	return (
		<Block className={style.content}>
			<Block>
				<SvgIcon description={"point"} iconPath={svg_point_on_map}/>
			</Block>
			<Block>{props.value}</Block>
			<Block>
				<SvgIcon description={"arrow down"} iconPath={svg_arrow_down}/>
			</Block>
		</Block>
	);

}

export default Address;