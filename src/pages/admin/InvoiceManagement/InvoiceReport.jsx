import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    InputAdornment
} from "@mui/material";
import { Search as SearchIcon, Download as DownloadIcon } from "@mui/icons-material";

const InvoiceReport = () => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [invoices, setInvoices] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');

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
                inv.staff_work?.Name?.toLowerCase().includes(q) ||
                inv.staff_work?.Work_Done?.toLowerCase().includes(q)
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
                    Created_At,
                    staff_work:Staff_Work_No (
                        Name,
                        Date,
                        Client,
                        Assignment,
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

    const handleExportCSV = () => {
        const headers = [
            'Invoice No',
            'Invoice Date',
            'Amount',
            'Staff Name',
            'Work Date',
            'Client',
            'Assignment',
            'Work Done'
        ];

        const rows = filtered.map(inv => [
            inv.Invoice_No,
            inv.Invoice_Date,
            inv.Amount,
            inv.staff_work?.Name ?? '',
            inv.staff_work?.Date ?? '',
            inv.staff_work?.Client ?? '',
            inv.staff_work?.Assignment ?? '',
            inv.staff_work?.Work_Done ?? ''
        ]);

        const csvContent = [headers, ...rows]
            .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
            .join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Invoice_Report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Container
            maxWidth="xl"
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
                    justifyContent: 'space-between',
                    mb: { xs: 2, md: 3 },
                    flexWrap: 'wrap',
                    gap: 2
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
                        sx={{ fontWeight: 600 }}
                    >
                        INVOICE REPORT
                    </Typography>
                    <Button
                        variant="contained"
                        color="success"
                        startIcon={<DownloadIcon />}
                        onClick={handleExportCSV}
                        disabled={filtered.length === 0}
                        size={isMobile ? 'small' : 'medium'}
                    >
                        Export CSV
                    </Button>
                </Box>

                {/* Search */}
                <TextField
                    fullWidth
                    size={isMobile ? 'small' : 'medium'}
                    placeholder="Search by invoice no, client, staff, work done..."
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

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                        <CircularProgress />
                    </Box>
                ) : filtered.length === 0 ? (
                    <Alert severity="info">
                        {invoices.length === 0 ? 'No invoices created yet.' : 'No results match your search.'}
                    </Alert>
                ) : (
                    <>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {filtered.length} record{filtered.length !== 1 ? 's' : ''}
                        </Typography>
                        <TableContainer sx={{ overflowX: 'auto' }}>
                            <Table size={isMobile ? 'small' : 'medium'}>
                                <TableHead>
                                    <TableRow sx={{ backgroundColor: theme.palette.primary.main }}>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Invoice No</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Invoice Date</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Amount</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Staff Name</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Work Date</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Client</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Assignment</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 600 }}>Work Done</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filtered.map((inv) => (
                                        <TableRow key={inv.id} hover>
                                            <TableCell>{inv.Invoice_No}</TableCell>
                                            <TableCell>{inv.Invoice_Date}</TableCell>
                                            <TableCell>₹{Number(inv.Amount).toLocaleString('en-IN')}</TableCell>
                                            <TableCell>{inv.staff_work?.Name ?? '-'}</TableCell>
                                            <TableCell>{inv.staff_work?.Date ?? '-'}</TableCell>
                                            <TableCell>{inv.staff_work?.Client ?? '-'}</TableCell>
                                            <TableCell>{inv.staff_work?.Assignment ?? '-'}</TableCell>
                                            <TableCell>{inv.staff_work?.Work_Done ?? '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </>
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
        </Container>
    );
};

export default withAuth(InvoiceReport);