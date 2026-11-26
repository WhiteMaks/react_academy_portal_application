import React, {FC, FormEvent, useEffect, useRef, useState} from "react";
import PostCoachV1Request from "../../../api/models/coach/PostCoachV1Request";
import DesignForm from "../common/design_form/DesignForm";
import {FORM_CHECK_BANNER, focusFirstFieldByName} from "../common/design_form/formContract";
import FormCheckBanner from "../common/form_check_banner/FormCheckBanner";
import CoachFormFields from "./CoachFormFields";
import {
	COACH_FIELD_FOCUS_ORDER,
	CoachFormField,
	CoachFormFieldErrors,
	CoachFormValues,
	EMPTY_COACH_FORM
} from "./coachFormTypes";
import {clearCoachFieldErrorsOnChange, updateCoachFormValue} from "./coachFormFieldUtils";
import {validateCoachForm} from "./coachFormValidate";

export type CoachCreateModalProps = {
	open: boolean;
	submitting: boolean;
	bannerError?: string | null;
	serverFieldErrors?: CoachFormFieldErrors;
	onClose: () => void;
	onSubmit: (body: PostCoachV1Request) => void;
	onClearServerErrors?: () => void;
};

const FOCUSABLE =
	'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const CoachCreateModal: FC<CoachCreateModalProps> = ({
	open,
	submitting,
	bannerError,
	serverFieldErrors,
	onClose,
	onSubmit,
	onClearServerErrors
}) => {
	const [form, setForm] = useState<CoachFormValues>(EMPTY_COACH_FORM);
	const [clientErrors, setClientErrors] = useState<CoachFormFieldErrors>({});
	const [formCheckBanner, setFormCheckBanner] = useState<string | null>(null);
	const titleRef = useRef<HTMLHeadingElement>(null);
	const dialogRef = useRef<HTMLDivElement>(null);
	const returnFocusRef = useRef<HTMLElement | null>(null);

	const fieldError = (field: CoachFormField): string | undefined =>
		clientErrors[field] ?? serverFieldErrors?.[field];

	const wasOpenRef = useRef(false);

	useEffect(() => {
		if (open && !wasOpenRef.current) {
			returnFocusRef.current = document.activeElement as HTMLElement | null;
			setForm(EMPTY_COACH_FORM);
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

	const focusFirstInvalidField = (errors: CoachFormFieldErrors) => {
		const names = COACH_FIELD_FOCUS_ORDER.filter(field => errors[field]);
		focusFirstFieldByName(dialogRef.current, names);
	};

	const onFieldChange = (key: keyof CoachFormValues, value: string) => {
		setForm(prev => updateCoachFormValue(prev, key, value));
		setClientErrors(prev => clearCoachFieldErrorsOnChange(prev, key));
		setFormCheckBanner(null);
	};

	const handleSubmit = (event: FormEvent) => {
		event.preventDefault();
		if (submitting) return;
		onClearServerErrors?.();
		const result = validateCoachForm(form);
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
				aria-labelledby="coach-modal-title"
				ref={dialogRef}
			>
				<header className="academy-modal__head">
					<h2 id="coach-modal-title" tabIndex={-1} ref={titleRef}>
						Добавить тренера
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
					<CoachFormFields
						form={form}
						fieldError={fieldError}
						onFieldChange={onFieldChange}
						idPrefix="coach-create"
					/>
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

export default CoachCreateModal;