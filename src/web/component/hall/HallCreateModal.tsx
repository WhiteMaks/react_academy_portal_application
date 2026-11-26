import React, {FC, FormEvent, useEffect, useRef, useState} from "react";
import PostHallV1Request from "../../../api/models/hall/PostHallV1Request";
import DesignForm from "../common/design_form/DesignForm";
import {FORM_CHECK_BANNER, focusFirstFieldByName} from "../common/design_form/formContract";
import FormCheckBanner from "../common/form_check_banner/FormCheckBanner";
import HallFormFields from "./HallFormFields";
import {
	EMPTY_HALL_FORM,
	HALL_FIELD_FOCUS_ORDER,
	HallFormField,
	HallFormFieldErrors,
	HallFormValues
} from "./hallFormTypes";
import {clearHallFieldErrorsOnChange, updateHallFormValue} from "./hallFormFieldUtils";
import {validateHallForm} from "./hallFormValidate";

export type HallCreateModalProps = {
	open: boolean;
	submitting: boolean;
	bannerError?: string | null;
	serverFieldErrors?: HallFormFieldErrors;
	onClose: () => void;
	onSubmit: (body: Omit<PostHallV1Request, "branch_id">) => void;
	onClearServerErrors?: () => void;
};

const FOCUSABLE =
	'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const HallCreateModal: FC<HallCreateModalProps> = ({
	open,
	submitting,
	bannerError,
	serverFieldErrors,
	onClose,
	onSubmit,
	onClearServerErrors
}) => {
	const [form, setForm] = useState<HallFormValues>(EMPTY_HALL_FORM);
	const [clientErrors, setClientErrors] = useState<HallFormFieldErrors>({});
	const [formCheckBanner, setFormCheckBanner] = useState<string | null>(null);
	const titleRef = useRef<HTMLHeadingElement>(null);
	const dialogRef = useRef<HTMLDivElement>(null);
	const returnFocusRef = useRef<HTMLElement | null>(null);
	const wasOpenRef = useRef(false);

	const fieldError = (field: HallFormField): string | undefined =>
		clientErrors[field] ?? serverFieldErrors?.[field];

	useEffect(() => {
		if (open && !wasOpenRef.current) {
			returnFocusRef.current = document.activeElement as HTMLElement | null;
			setForm(EMPTY_HALL_FORM);
			setClientErrors({});
			setFormCheckBanner(null);
			onClearServerErrors?.();
			window.requestAnimationFrame(() => titleRef.current?.focus());
		}
		wasOpenRef.current = open;
	}, [open, onClearServerErrors]);

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

	const focusFirstInvalidField = (errors: HallFormFieldErrors) => {
		const names = HALL_FIELD_FOCUS_ORDER.filter(field => errors[field]);
		focusFirstFieldByName(dialogRef.current, names);
	};

	const onFieldChange = (key: keyof HallFormValues, value: string) => {
		setForm(prev => updateHallFormValue(prev, key, value));
		setClientErrors(prev => clearHallFieldErrorsOnChange(prev, key));
		setFormCheckBanner(null);
		onClearServerErrors?.();
	};

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault();
		if (submitting) return;
		onClearServerErrors?.();
		const result = validateHallForm(form);
		if (!result.ok) {
			setClientErrors(result.errors);
			setFormCheckBanner(FORM_CHECK_BANNER);
			focusFirstInvalidField(result.errors);
			return;
		}
		setClientErrors({});
		setFormCheckBanner(null);
		onSubmit(result.body);
	};

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
				aria-labelledby="hall-modal-title"
				ref={dialogRef}
			>
				<header className="academy-modal__head">
					<h2 id="hall-modal-title" tabIndex={-1} ref={titleRef}>
						Новый зал
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
				<DesignForm onSubmit={handleSubmit}>
					{formCheckBanner ? <FormCheckBanner message={formCheckBanner}/> : null}
					{bannerError && !formCheckBanner ? <FormCheckBanner message={bannerError}/> : null}
					<HallFormFields form={form} fieldError={fieldError} onFieldChange={onFieldChange} idPrefix="hall-create"/>
					<footer className="academy-modal__actions">
						<button type="button" className="btn" disabled={submitting} onClick={onClose}>
							Отмена
						</button>
						<button type="submit" className="btn btn--gold" disabled={submitting}>
							Сохранить
						</button>
					</footer>
				</DesignForm>
			</div>
		</div>
	);
};

export default HallCreateModal;