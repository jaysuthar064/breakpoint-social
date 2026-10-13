import { useEffect, useRef, useState } from 'react';

import { fetchContactToken, submitContact } from '../lib/api.js';

/**
 * The enquiry form.
 *
 * The field list comes from the server so the form and the validator can never
 * disagree about what is required.
 */
export function ContactForm({ submitLabel = 'Submit', successTitle, successBody }) {
  const [fields, setFields] = useState([]);
  const [token, setToken] = useState('');
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('loading'); // loading | ready | sending | sent | failed
  const [message, setMessage] = useState('');
  const summaryRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    fetchContactToken()
      .then((data) => {
        if (cancelled) {
          return;
        }

        setFields(data.fields ?? []);
        setToken(data.token ?? '');
        setStatus('ready');
      })
      .catch(() => {
        if (!cancelled) {
          setStatus('failed');
          setMessage('The form could not be loaded. Please email taylor@breakpointsocial.com.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => {
      if (!current[key]) {
        return current;
      }

      const next = { ...current };
      delete next[key];

      return next;
    });
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    // Validate locally first so the reader sees every problem at once rather
    // than one per round trip.
    const found = {};

    fields.forEach((field) => {
      if (field.required && !String(values[field.key] ?? '').trim()) {
        found[field.key] = `${field.label} is required.`;
      }
    });

    if (Object.keys(found).length > 0) {
      setErrors(found);
      // WCAG: move focus to the summary so a screen reader announces it.
      requestAnimationFrame(() => summaryRef.current?.focus());

      return;
    }

    setStatus('sending');
    setErrors({});

    try {
      const result = await submitContact({ ...values, token });

      setStatus('sent');
      setMessage(result.message ?? '');
    } catch (error) {
      setStatus('ready');

      if (error.field) {
        setErrors({ [error.field]: error.message });
        requestAnimationFrame(() => summaryRef.current?.focus());
      } else {
        setMessage(error.message);
      }
    }
  };

  if (status === 'sent') {
    return (
      <div
        role="status"
        className="mx-auto max-w-xl rounded-2xl border border-[#84572f]/10 bg-white p-8 text-center shadow-sm"
      >
        <h3 className="text-2xl font-extrabold tracking-tight text-[#141615]">
          {successTitle || 'Thank you. We will be in touch.'}
        </h3>
        <p className="mt-3 leading-relaxed text-[#141615]/70">
          {successBody || message}
        </p>
      </div>
    );
  }

  if (status === 'loading') {
    return (
      <p role="status" className="py-10 text-center text-[#141615]/60">
        Loading the form.
      </p>
    );
  }

  const errorList = Object.entries(errors);

  return (
    <form onSubmit={onSubmit} noValidate className="mx-auto max-w-3xl">
      {errorList.length > 0 && (
        <div
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-5"
        >
          <h3 className="font-extrabold tracking-tight text-red-800">There is a problem</h3>
          <ul className="mt-2 list-disc pl-5 text-sm text-red-800">
            {errorList.map(([key, text]) => (
              <li key={key}>
                {/* Linked so activating it jumps straight to the field. */}
                <a href={`#contact-${key}`} className="underline">
                  {text}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {message && errorList.length === 0 && (
        <p role="alert" className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
          {message}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => {
          const isWide = field.type === 'textarea';

          return (
            <div key={field.key} className={isWide ? 'sm:col-span-2' : ''}>
              <label
                htmlFor={`contact-${field.key}`}
                className="mb-1.5 block text-xs font-semibold tracking-wide text-[#141615]"
              >
                {field.label}
                {field.required && (
                  <>
                    <span aria-hidden="true" className="ml-1 text-red-700">
                      *
                    </span>
                    <span className="sr-only"> (required)</span>
                  </>
                )}
              </label>

              {isWide ? (
                <textarea
                  id={`contact-${field.key}`}
                  rows={4}
                  value={values[field.key] ?? ''}
                  aria-invalid={errors[field.key] ? true : undefined}
                  aria-describedby={errors[field.key] ? `contact-${field.key}-error` : undefined}
                  onChange={(event) => setValue(field.key, event.target.value)}
                  className="w-full rounded-xl border border-[#9a8a6d] bg-white px-4 py-3 text-[#1a1a1a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#84572f]"
                />
              ) : (
                <input
                  id={`contact-${field.key}`}
                  type={field.type}
                  autoComplete={field.autocomplete}
                  value={values[field.key] ?? ''}
                  aria-invalid={errors[field.key] ? true : undefined}
                  aria-describedby={errors[field.key] ? `contact-${field.key}-error` : undefined}
                  onChange={(event) => setValue(field.key, event.target.value)}
                  className="w-full rounded-xl border border-[#9a8a6d] bg-white px-4 py-3 text-[#1a1a1a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#84572f]"
                />
              )}

              {errors[field.key] && (
                <p id={`contact-${field.key}-error`} className="mt-1.5 text-xs text-red-700">
                  {errors[field.key]}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/*
        Honeypot. Hidden from sight AND from the accessibility tree, so no
        human fills it in by any means, while a bot reading the markup will.
      */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-company_website">Company website</label>
        <input
          id="contact-company_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.company_website ?? ''}
          onChange={(event) => setValue('company_website', event.target.value)}
        />
      </div>

      <div className="mt-7">
        <button
          type="submit"
          disabled={status === 'sending'}
          aria-busy={status === 'sending' || undefined}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-[#84572f] px-7 py-3.5 text-xs font-semibold tracking-wider text-white uppercase shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#6c4625] disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#84572f]"
        >
          {status === 'sending' ? 'Sending' : submitLabel}
        </button>
      </div>
    </form>
  );
}
