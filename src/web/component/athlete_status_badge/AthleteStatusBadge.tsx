import React, {FC} from "react";
import style from "./AthleteStatusBadge.module.css";

interface AthleteStatusBadgeProps {
	active: boolean;
}

const AthleteStatusBadge: FC<AthleteStatusBadgeProps> = ({active}) => (
	<span className={[style.badge, active ? style.active : style.inactive].join(" ")}>
		<span className={style.dot} aria-hidden="true"/>
		<span>{active ? "Активна" : "Неактивна"}</span>
	</span>
);

export default AthleteStatusBadge;
