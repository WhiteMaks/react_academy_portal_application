import React, {FC, useEffect, useRef} from "react";

export type BranchDeactivateConfirmModalProps = {
	open: boolean;
	submitting: boolean;
	onClose: () => void;
	onConfirm: () => void;
};

const FOCUSABLE =
	'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const BranchDeactivateConfirmModal: FC<BranchDeactivateConfirmModalProps> = ({
	open,
	submitting,
	onClose,
	onConfirm
}) => {
	const titleRef = useRef<HTMLHeadingElement>(null);
	const dialogRef = useRef<HTMLDivElement>(null);
	const returnFocusRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		if (!open) return;
		returnFocusRef.current = document.activeElement as HTMLElement | null;
		window.requestAnimationFrame(() => titleRef.current?.focus());
	}, [open]);

	useEffect(() => {
		if (open) return;
		const el = returnFocusRef.current;
		if (el && typeof el.focus === "function") el.focus();
	}, [open]);

	useEffect(() => {
		if (!open) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape" && !submitting) {
				event.preventDefault();
				onClose();
			}
			if (event.key === "Tab" && dialogRef.current) {
				const nodes = dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE);
				if (nodes.length === 0) return;
				const first = nodes[0];
				const last = nodes[nodes.length - 1];
				if (event.shiftKey && document.activeElement === first) {
					event.preventDefault();
					last.focus();
				} else if (!event.shiftKey && document.activeElement === last) {
					event.preventDefault();
					first.focus();
				}
			}
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, onClose, submitting]);

	if (!open) return null;

	return (
		<div
			className="academy-modal-backdrop academy-modal-backdrop--open"
			role="presentation"
			onMouseDown={event => {
				if (event.target === event.currentTarget && !submitting) onClose();
			}}
		>
			<div
				className="academy-modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby="deactivate-branch-title"
				ref={dialogRef}
			>
				<header className="academy-modal__head">
					<h2 className="academy-modal__title" id="deactivate-branch-title" tabIndex={-1} ref={titleRef}>
						Сделать филиал неактивным?
					</h2>
					<button
						type="button"
						className="academy-modal__close"
						aria-label="Закрыть"
						disabled={submitting}
						onClick={onClose}
					>
						×
					</button>
				</header>
				<p className="academy-modal__intro">
					Все спортзалы этого филиала станут неактивными. Вернуть их в активные можно будет по одному после
					активации филиала.
				</p>
				<footer className="academy-modal__foot">
					<button type="button" className="btn" disabled={submitting} onClick={onClose}>
						Отмена
					</button>
					<button type="button" className="btn btn--primary" disabled={submitting} onClick={onConfirm}>
						Сделать неактивным
					</button>
				</footer>
			</div>
		</div>
	);
};

export default BranchDeactivateConfirmModal;