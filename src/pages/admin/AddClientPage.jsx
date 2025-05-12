import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';

const AddClientPage = () => {
    const navigate = useNavigate();
    const [newClientName, setNewClientName] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess(false);

        try {
            // Validate input
            const trimmedName = newClientName.trim();
            if (!trimmedName) {
                throw new Error('Client name cannot be empty');
            }

            // Check for duplicates in Supabase (case insensitive)
            const { data: existingClients, error: queryError } = await supabase
                .from('Clients List')
                .select('Client_Name')
                .ilike('Client_Name', trimmedName); // Case-insensitive comparison

            if (queryError) throw queryError;
            if (existingClients && existingClients.length > 0) {
                throw new Error('Client already exists in the list');
            }

            // Add to Supabase
            const { error: insertError } = await supabase
                .from('Clients List')
                .insert([{ 
                    Client_Name: trimmedName,
                }]);

            if (insertError) throw insertError;

            // Success state
            setSuccess(true);
            setNewClientName('');
            
            // Redirect after 1.5 seconds
            setTimeout(() => navigate('/admindash'), 1500);
        } catch (err) {
            console.error('Error adding client:', err);
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto p-4 max-w-md">
            <h1 className="text-2xl font-bold mb-6">Add New Client</h1>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="clientName" className="block mb-2 font-medium">
                        Client Name
                    </label>
                    <input
                        type="text"
                        id="clientName"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        className="w-full p-2 border rounded"
                        placeholder="Enter client name"
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
                        Client added successfully! Redirecting...
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
                        {isSubmitting ? 'Adding...' : 'Add Client'}
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

export default AddClientPage;