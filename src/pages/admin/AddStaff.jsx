import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

const AddStaff = () => {
    const navigate = useNavigate();
    const [newStaffName, setNewStaffName] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess(false);

        try {
            // Validate inputs
            const trimmedName = newStaffName.trim();
            if (!trimmedName) {
                throw new Error('Staff name cannot be empty');
            }

            const rate = parseFloat(hourlyRate);
            if (isNaN(rate) || rate <= 0) {
                throw new Error('Please enter a valid hourly rate (greater than 0)');
            }

            // Check for duplicates in Supabase (case insensitive)
            const { data: existingStaff, error: queryError } = await supabase
                .from('Staff List')
                .select('Staff_Name')
                .ilike('Staff_Name', trimmedName);

            if (queryError) throw queryError;
            if (existingStaff && existingStaff.length > 0) {
                throw new Error('Staff already exists in the list');
            }

            // Add to Supabase
            const { error: insertError } = await supabase
                .from('Staff List')
                .insert([{ 
                    Staff_Name: trimmedName,
                    hourly_rate: rate
                }]);

            if (insertError) throw insertError;

            // Success state
            setSuccess(true);
            setNewStaffName('');
            setHourlyRate('');
            
            // Redirect after 1.5 seconds
            setTimeout(() => navigate('/admindash'), 1500);
        } catch (err) {
            console.error('Error adding staff:', err);
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-md">
            <h1 className="text-2xl font-bold mb-6">Add New Staff</h1>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="staffName" className="block mb-2 font-medium">
                        Staff Name
                    </label>
                    <input
                        type="text"
                        id="staffName"
                        value={newStaffName}
                        onChange={(e) => setNewStaffName(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Enter staff name"
                        required
                        disabled={isSubmitting}
                    />
                </div>

                <div>
                    <label htmlFor="hourlyRate" className="block mb-2 font-medium">
                        Hourly Rate
                    </label>
                    <input
                        type="number"
                        id="hourlyRate"
                        value={hourlyRate}
                        onChange={(e) => setHourlyRate(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Enter hourly rate"
                        min="0"
                        step="0.01"
                        required
                        disabled={isSubmitting}
                    />
                </div>

                {error && (
                    <div className="p-2 text-red-500 bg-red-50 rounded">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="p-2 text-green-500 bg-green-50 rounded">
                        Staff added successfully! Redirecting...
                    </div>
                )}

                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`px-4 py-2 text-white rounded ${
                            isSubmitting ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {isSubmitting ? 'Adding...' : 'Add Staff'}
                    </button>
                    <button
                        type="button"
                        onClick={() => navigate('/admindash')}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddStaff;