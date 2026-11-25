import React, {FC} from "react";
import style from "./AuthBrand.module.css";

const CLUB_LOGO = `${process.env.PUBLIC_URL}/brand/club-logo.png`;

const AuthBrand: FC = () => (
	<div className={style.brand}>
		<img className={style.logo} src={CLUB_LOGO} alt="Логотип Академии Единоборств" width={52} height={52}/>
		<div className={style.text}>
			<strong>АКАДЕМИЯ<br/>ЕДИНОБОРСТВ</strong>
			<small>СИСТЕМА УПРАВЛЕНИЯ</small>
		</div>
	</div>
);

export default AuthBrand;