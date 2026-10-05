import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabaseClient';
import withAuth from '../../../components/withAuth';

import {
    Box,
    Typography,
    Paper,
    Container,
    useTheme,
    useMediaQuery,
    TextField,
    Button,
    Alert,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment
} from "@mui/material";
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const CreateInvoice = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();

    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);

    // Invoice form state
    const [invoiceNo, setInvoiceNo] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date());
    const [amount, setAmount] = useState('');

    useEffect(() => {
        fetchEntries();
    }, []);

    const fetchEntries = async () => {
        setLoading(true);
        setError('');
        try {
            const { data, error } = await supabase
                .from('Staff Work')
                .select('No, Name, Date, Client, Work_Done, Assignment')
                .eq('Ready_for_Billing', true)
                .eq('Invoiced', false)
                .order('Date', { ascending: false });

            if (error) throw error;
            setEntries(data || []);
        } catch (err) {
            setError(`Failed to load entries: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (entry) => {
        setSelectedEntry(entry);
        setInvoiceNo('');
        setInvoiceDate(new Date());
        setAmount('');
        setDialogOpen(true);
    };

    const handleDialogClose = () => {
        setDialogOpen(false);
        setSelectedEntry(null);
    };

    const handleCreateInvoice = async () => {
        if (!invoiceNo.trim()) {
            setError('Invoice number cannot be empty');
            return;
        }
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            // Format date for DB
            const formattedDate = invoiceDate instanceof Date
                ? `${invoiceDate.getFullYear()}-${(invoiceDate.getMonth() + 1).toString().padStart(2, '0')}-${invoiceDate.getDate().toString().padStart(2, '0')}`
                : invoiceDate;

            // Insert into Invoices table
            const { error: insertError } = await supabase
                .from('Invoices')
                .insert([{
                    Invoice_No: invoiceNo.trim(),
                    Invoice_Date: formattedDate,
                    Amount: parseFloat(amount),
                    Staff_Work_No: selectedEntry.No
                }]);

            if (insertError) throw insertError;

            // Mark the Staff Work entry as Invoiced
            const { error: updateError } = await supabase
                .from('Staff Work')
                .update({ Invoiced: true })
                .eq('No', selectedEntry.No);

            if (updateError) throw updateError;

            setSuccess(`Invoice ${invoiceNo} created successfully.`);
            setDialogOpen(false);

            // Remove the invoiced entry from the list
            setEntries(prev => prev.filter(e => e.No !== selectedEntry.No));
            setSelectedEntry(null);

        } catch (err) {
            setError(`Failed to create invoice: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Container
                maxWidth="lg"
                sx={{
                    py: { xs: 2, md: 4 },
                    px: { xs: 2, sm: 3, md: 4 },
                    minHeight: '100vh'
                }}
            >
                <Paper
                    elevation={isMobile ? 2 : 4}
                    sx={{
                        width: '100%',
                        padding: { xs: 2.5, sm: 3, md: 4 },
                        borderRadius: { xs: 1.5, md: 2 }
                    }}
                >
                    {/* Header */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isMobile ? 'center' : 'space-between',
                        mb: { xs: 2, md: 3 }
                    }}>
                        {!isMobile && (
                            <Button
                                component={Link}
                                to="/admin/InvoiceManagement"
                                variant="contained"
                                color="primary"
                            >
                                BACK
                            </Button>
                        )}
                        <Typography
                            variant={isMobile ? "h6" : "h5"}
                            sx={{ fontWeight: 600, textAlign: 'center', flexGrow: isMobile ? 1 : 0 }}
                        >
                            CREATE INVOICE
                        </Typography>
                        {!isMobile && <Box sx={{ width: 100 }} />}
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                            {error}
                        </Alert>
                    )}
                    {success && (
                        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                            {success}
                        </Alert>
                    )}

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Click any row to create an invoice for that work entry.
                    </Typography>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress />
                        </Box>
                    ) : entries.length === 0 ? (
                        <Alert severity="info">
                            No entries marked as Ready for Billing. Mark entries as Ready for Billing from the data entry section.
                        </Alert>
                    ) : (
                        <TableContainer>
                            <Table size={isMobile ? 'small' : 'medium'}>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Date</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Staff Name</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Client</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Assignment</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Work Done</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {entries.map((entry) => (
                                        <TableRow
                                            key={entry.No}
                                            hover
                                            onClick={() => handleRowClick(entry)}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <TableCell>{entry.Date}</TableCell>
                                            <TableCell>{entry.Name}</TableCell>
                                            <TableCell>{entry.Client}</TableCell>
                                            <TableCell>{entry.Assignment}</TableCell>
                                            <TableCell>{entry.Work_Done}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}

                    {isMobile && (
                        <Button
                            component={Link}
                            to="/admin/InvoiceManagement"
                            variant="outlined"
                            fullWidth
                            sx={{ mt: 3 }}
                        >
                            BACK
                        </Button>
                    )}
                </Paper>

                {/* Invoice Creation Dialog */}
                <Dialog
                    open={dialogOpen}
                    onClose={handleDialogClose}
                    fullWidth
                    maxWidth="sm"
                    fullScreen={isMobile}
                >
                    <DialogTitle sx={{ fontWeight: 600 }}>
                        Create Invoice
                    </DialogTitle>
                    <DialogContent>
                        {selectedEntry && (
                            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                                <Typography variant="body2" color="text.secondary">Work Entry Details</Typography>
                                <Typography variant="body1"><strong>Staff:</strong> {selectedEntry.Name}</Typography>
                                <Typography variant="body1"><strong>Date:</strong> {selectedEntry.Date}</Typography>
                                <Typography variant="body1"><strong>Client:</strong> {selectedEntry.Client}</Typography>
                                <Typography variant="body1"><strong>Work Done:</strong> {selectedEntry.Work_Done}</Typography>
                            </Box>
                        )}

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
                            <TextField
                                label="Invoice Number"
                                value={invoiceNo}
                                onChange={(e) => setInvoiceNo(e.target.value)}
                                fullWidth
                                required
                                size={isMobile ? 'small' : 'medium'}
                                placeholder="e.g. INV-2026-001"
                            />

                            <DatePicker
                                label="Invoice Date"
                                value={invoiceDate}
                                onChange={(newDate) => setInvoiceDate(newDate)}
                                slotProps={{
                                    textField: {
                                        fullWidth: true,
                                        required: true,
                                        size: isMobile ? 'small' : 'medium'
                                    }
                                }}
                            />

                            <TextField
                                label="Amount"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                fullWidth
                                required
                                type="number"
                                size={isMobile ? 'small' : 'medium'}
                                inputProps={{ min: 0, step: '0.01' }}
                                InputProps={{
                                    startAdornment: <InputAdornment position="start">₹</InputAdornment>
                                }}
                            />
                        </Box>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
                        <Button
                            onClick={handleDialogClose}
                            variant="outlined"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateInvoice}
                            variant="contained"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Create Invoice'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </LocalizationProvider>
    );
};

export default withAuth(CreateInvoice);