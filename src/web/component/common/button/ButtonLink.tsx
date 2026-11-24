import React, {AnchorHTMLAttributes, FC, ReactNode} from "react";
import {Link, LinkProps} from "react-router-dom";
import style from "./Button.module.css";

type ButtonLinkProps = Omit<LinkProps, "children"> & AnchorHTMLAttributes<HTMLAnchorElement> & {
	children: ReactNode;
	variant?: "primary" | "secondary" | "text";
	fullWidth?: boolean;
};

const ButtonLink: FC<ButtonLinkProps> = ({variant = "primary", fullWidth = false, className, children, ...props}) => (
	<Link {...props} className={[style.button, style[variant], fullWidth ? style.fullWidth : "", className ?? ""].filter(Boolean).join(" ")}>
		<span className={style.content}>{children}</span>
	</Link>
);

export default ButtonLink;
