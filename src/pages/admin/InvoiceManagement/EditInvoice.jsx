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
    Button,
    Alert,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogContentText
} from "@mui/material";
import { Search as SearchIcon } from "@mui/icons-material";
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const EditInvoice = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const navigate = useNavigate();

    const [invoices, setInvoices] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [search, setSearch] = useState('');

    // Edit dialog state
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [invoiceNo, setInvoiceNo] = useState('');
    const [invoiceDate, setInvoiceDate] = useState(new Date());
    const [amount, setAmount] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Delete confirmation dialog state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        fetchInvoices();
    }, []);

    useEffect(() => {
        if (!search.trim()) {
            setFiltered(invoices);
        } else {
            const q = search.toLowerCase();
            setFiltered(invoices.filter(inv =>
                inv.Invoice_No?.toLowerCase().includes(q) ||
                inv.staff_work?.Client?.toLowerCase().includes(q) ||
                inv.staff_work?.Name?.toLowerCase().includes(q)
            ));
        }
    }, [search, invoices]);

    const fetchInvoices = async () => {
        setLoading(true);
        setError('');
        try {
            const { data, error } = await supabase
                .from('Invoices')
                .select(`
                    id,
                    Invoice_No,
                    Invoice_Date,
                    Amount,
                    Staff_Work_No,
                    staff_work:Staff_Work_No (
                        Name,
                        Date,
                        Client,
                        Work_Done
                    )
                `)
                .order('Invoice_Date', { ascending: false });

            if (error) throw error;
            setInvoices(data || []);
            setFiltered(data || []);
        } catch (err) {
            setError(`Failed to load invoices: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRowClick = (invoice) => {
        setSelectedInvoice(invoice);
        setInvoiceNo(invoice.Invoice_No);
        setInvoiceDate(invoice.Invoice_Date ? new Date(invoice.Invoice_Date) : new Date());
        setAmount(String(invoice.Amount));
        setError('');
        setEditDialogOpen(true);
    };

    const handleEditDialogClose = () => {
        setEditDialogOpen(false);
        setSelectedInvoice(null);
    };

    const handleUpdate = async () => {
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
            const formattedDate = invoiceDate instanceof Date
                ? `${invoiceDate.getFullYear()}-${(invoiceDate.getMonth() + 1).toString().padStart(2, '0')}-${invoiceDate.getDate().toString().padStart(2, '0')}`
                : invoiceDate;

            const { error: updateError } = await supabase
                .from('Invoices')
                .update({
                    Invoice_No: invoiceNo.trim(),
                    Invoice_Date: formattedDate,
                    Amount: parseFloat(amount)
                })
                .eq('id', selectedInvoice.id);

            if (updateError) throw updateError;

            setSuccess(`Invoice ${invoiceNo} updated successfully.`);
            setEditDialogOpen(false);
            fetchInvoices();

        } catch (err) {
            setError(`Failed to update invoice: ${err.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClick = (invoice, e) => {
        e.stopPropagation(); // Prevent row click from firing
        setInvoiceToDelete(invoice);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!invoiceToDelete) return;
        setIsDeleting(true);
        setError('');

        try {
            // Delete from Invoices table
            const { error: deleteError } = await supabase
                .from('Invoices')
                .delete()
                .eq('id', invoiceToDelete.id);

            if (deleteError) throw deleteError;

            // Reset Invoiced flag on the Staff Work row so it reappears in Create Invoice
            if (invoiceToDelete.Staff_Work_No) {
                const { error: updateError } = await supabase
                    .from('Staff Work')
                    .update({ Invoiced: false })
                    .eq('No', invoiceToDelete.Staff_Work_No);

                if (updateError) throw updateError;
            }

            setSuccess(`Invoice deleted successfully.`);
            setDeleteDialogOpen(false);
            setInvoiceToDelete(null);
            fetchInvoices();

        } catch (err) {
            setError(`Failed to delete invoice: ${err.message}`);
        } finally {
            setIsDeleting(false);
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
                            >
                                BACK
                            </Button>
                        )}
                        <Typography
                            variant={isMobile ? "h6" : "h5"}
                            sx={{ fontWeight: 600, textAlign: 'center', flexGrow: isMobile ? 1 : 0 }}
                        >
                            EDIT INVOICE
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

                    {/* Search */}
                    <TextField
                        fullWidth
                        size={isMobile ? 'small' : 'medium'}
                        placeholder="Search by invoice no, client, staff..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon />
                                </InputAdornment>
                            )
                        }}
                    />

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Click a row to edit. Use the Delete button to remove an invoice.
                    </Typography>

                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                            <CircularProgress />
                        </Box>
                    ) : filtered.length === 0 ? (
                        <Alert severity="info">
                            {invoices.length === 0 ? 'No invoices found.' : 'No results match your search.'}
                        </Alert>
                    ) : (
                        <TableContainer>
                            <Table size={isMobile ? 'small' : 'medium'}>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Invoice No</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Invoice Date</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Amount</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Staff Name</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Client</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Work Done</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filtered.map((inv) => (
                                        <TableRow
                                            key={inv.id}
                                            hover
                                            onClick={() => handleRowClick(inv)}
                                            sx={{ cursor: 'pointer' }}
                                        >
                                            <TableCell>{inv.Invoice_No}</TableCell>
                                            <TableCell>{inv.Invoice_Date}</TableCell>
                                            <TableCell>₹{Number(inv.Amount).toLocaleString('en-IN')}</TableCell>
                                            <TableCell>{inv.staff_work?.Name ?? '-'}</TableCell>
                                            <TableCell>{inv.staff_work?.Client ?? '-'}</TableCell>
                                            <TableCell>{inv.staff_work?.Work_Done ?? '-'}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="outlined"
                                                    color="error"
                                                    size="small"
                                                    onClick={(e) => handleDeleteClick(inv, e)}
                                                >
                                                    Delete
                                                </Button>
                                            </TableCell>
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

                {/* Edit Dialog */}
                <Dialog
                    open={editDialogOpen}
                    onClose={handleEditDialogClose}
                    fullWidth
                    maxWidth="sm"
                    fullScreen={isMobile}
                >
                    <DialogTitle sx={{ fontWeight: 600 }}>Edit Invoice</DialogTitle>
                    <DialogContent>
                        {selectedInvoice && (
                            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.100', borderRadius: 1 }}>
                                <Typography variant="body2" color="text.secondary">Work Entry</Typography>
                                <Typography variant="body1"><strong>Staff:</strong> {selectedInvoice.staff_work?.Name ?? '-'}</Typography>
                                <Typography variant="body1"><strong>Client:</strong> {selectedInvoice.staff_work?.Client ?? '-'}</Typography>
                                <Typography variant="body1"><strong>Work Done:</strong> {selectedInvoice.staff_work?.Work_Done ?? '-'}</Typography>
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
                            onClick={handleEditDialogClose}
                            variant="outlined"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            variant="contained"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Delete Confirmation Dialog */}
                <Dialog
                    open={deleteDialogOpen}
                    onClose={() => setDeleteDialogOpen(false)}
                >
                    <DialogTitle>Delete Invoice</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            Are you sure you want to delete invoice <strong>{invoiceToDelete?.Invoice_No}</strong>? 
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                        <Button
                            onClick={() => setDeleteDialogOpen(false)}
                            variant="outlined"
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDeleteConfirm}
                            variant="contained"
                            color="error"
                            disabled={isDeleting}
                        >
                            {isDeleting ? <CircularProgress size={20} color="inherit" /> : 'Delete'}
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </LocalizationProvider>
    );
};

export default withAuth(EditInvoice);