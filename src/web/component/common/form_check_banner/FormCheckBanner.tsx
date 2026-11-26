import React, {FC} from "react";

export type FormCheckBannerProps = {
	message: string;
	/** auth — без modal-класса; модалка — academy-modal__banner-error */
	variant?: "auth" | "modal";
	id?: string;
};

const FormCheckBanner: FC<FormCheckBannerProps> = ({message, variant = "modal", id}) => (
	<p
		id={id}
		className={[
			"academy-alert",
			"academy-alert--error",
			variant === "modal" ? "academy-modal__banner-error" : ""
		].filter(Boolean).join(" ")}
		role="alert"
	>
		{message}
	</p>
);

export default FormCheckBanner;