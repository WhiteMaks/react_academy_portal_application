import React, {FC} from "react";

const CLUB_LOGO = `${process.env.PUBLIC_URL}/brand/club-logo.png`;

const AuthBrand: FC = () => (
	<div className="academy-auth__brand">
		<img
			className="academy-auth__logo"
			src={CLUB_LOGO}
			alt="Логотип Академии Единоборств"
			width={52}
			height={52}
			decoding="async"
		/>
		<div className="academy-auth__brand-text">
			<strong>АКАДЕМИЯ<br/>ЕДИНОБОРСТВ</strong>
			<small>СИСТЕМА УПРАВЛЕНИЯ</small>
		</div>
	</div>
);

export default AuthBrand;