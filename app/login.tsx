
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');

	const validate = () => {
		if (!email || !email.includes('@')) {
			setError('Please enter a valid email address.');
			return false;
		}
		if (!password || password.length < 6) {
			setError('Password must be at least 6 characters.');
			return false;
		}
		return true;
	};


	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		 e.preventDefault();
		setError('');
		setSuccess('');
		if (!validate()) return;

		setLoading(true);
		try {
					const res = await fetch('/api/login', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({ email, password }),
						// ensure cookies from the response are accepted and stored by the browser
						credentials: 'same-origin',
					});

			if (!res.ok) {
				// Try to parse error message from response
				const payload = await res.json().catch(() => null);
				throw new Error((payload && payload.message) || res.statusText || 'Login failed');
			}

			setSuccess('Login successful — redirecting...');
			// small delay to show success message, then navigate
			setTimeout(() => router.push('/dashboard'), 800);
			} catch (err: unknown) {
				if (err instanceof Error) {
					setError(err.message);
				} else {
					setError(String(err));
				}
		} finally {
			setLoading(false);
		}
	};

	return (
		<main style={styles.page}>
			<form onSubmit={handleSubmit} style={styles.card} aria-labelledby="login-heading">
				<h1 id="login-heading" style={styles.title}>Sign in</h1>

				{error && <div role="alert" style={styles.error}>{error}</div>}
				{success && <div role="status" style={styles.success}>{success}</div>}

				<label style={styles.label} htmlFor="email">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					required
					style={styles.input}
					placeholder="you@example.com"
				/>

				<label style={styles.label} htmlFor="password">Password</label>
				<input
					id="password"
					name="password"
					type="password"
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					required
					style={styles.input}
					placeholder="Enter your password"
				/>

				<button type="submit" style={loading ? { ...styles.button, opacity: 0.7 } : styles.button} disabled={loading}>
					{loading ? 'Signing in…' : 'Sign in'}
				</button>

				<p style={styles.footerText}>
					Don’t have an account? <a href="/register" style={styles.link}>Register</a>
				</p>
			</form>
		</main>
	);
}

const styles: Record<string, React.CSSProperties> = {
	page: {
		minHeight: '100vh',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: '24px',
		background: 'var(--background, #f7f7fb)'
	},
	card: {
		width: '100%',
		maxWidth: '420px',
		padding: '28px',
		borderRadius: '10px',
		boxShadow: '0 6px 18px rgba(10,10,10,0.08)',
		background: 'var(--color-background, #fff)'
	},
	title: {
		margin: 0,
		marginBottom: '18px',
		fontSize: '20px',
		fontWeight: 600,
	},
	label: {
		display: 'block',
		marginTop: '12px',
		marginBottom: '6px',
		fontSize: '13px',
	},
	input: {
		width: '100%',
		padding: '10px 12px',
		borderRadius: '8px',
		border: '1px solid #d1d5db',
		fontSize: '14px',
		boxSizing: 'border-box'
	},
	button: {
		width: '100%',
		marginTop: '18px',
		padding: '10px 12px',
		borderRadius: '8px',
		background: '#0f62fe',
		color: '#fff',
		border: 'none',
		cursor: 'pointer',
		fontWeight: 600,
		fontSize: '15px'
	},
	error: {
		background: '#ffefef',
		color: '#9b1c1c',
		padding: '8px 10px',
		borderRadius: '6px',
		marginBottom: '12px',
	},
	success: {
		background: '#effaf3',
		color: '#0a6a3a',
		padding: '8px 10px',
		borderRadius: '6px',
		marginBottom: '12px',
	},
	footerText: {
		marginTop: '14px',
		fontSize: '13px',
		color: 'var(--foreground, #111)'
	},
	link: {
		color: '#0f62fe',
		textDecoration: 'none'
	}
};

