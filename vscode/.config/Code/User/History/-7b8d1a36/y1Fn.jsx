import { useState } from 'react';
import api from '../services/api';

export default function SignupPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/signup', form);
      window.location.href = '/login';
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h2 className="text-2xl mb-4 font-bold">Sign Up</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required className="border p-2 rounded" />
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required className="border p-2 rounded" />
        <input name="password" type="password" placeholder="Password" value={form.password} onChange={handleChange} required className="border p-2 rounded" />
        <button type="submit" className="bg-blue-600 text-white py-2 rounded" disabled={loading}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>
        <a href="/login" className="text-blue-600 text-sm">Already have an account? Login</a>
        {error && <div className="text-red-600">{error}</div>}
      </form>
    </div>
  );
}