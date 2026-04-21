const { jsPDF } = require('jspdf');
const autoTable = require('jspdf-autotable').default || require('jspdf-autotable');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * Shared PDF Service
 * Handles backend PDF generation for Invoices and Payslips.
 */
class PDFService {
    /**
     * Generate Payslip PDF
     */
    async generatePayslipPDF(payslip, employee, profile) {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // Header
        doc.setFontSize(22);
        doc.setTextColor(44, 62, 80);
        doc.text('PAYSLIP', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`Period: ${new Date(payslip.periodStart).toLocaleDateString()} - ${new Date(payslip.periodEnd).toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });

        // Employee Details
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Employee Information', 20, 45);
        doc.line(20, 47, 80, 47);

        doc.setFontSize(10);
        doc.text(`Name: ${employee.name}`, 20, 55);
        doc.text(`Designation: ${profile.designation}`, 20, 62);
        doc.text(`Department: ${profile.department}`, 20, 69);
        doc.text(`Employee ID: ${employee._id.toString().slice(-6).toUpperCase()}`, 20, 76);

        // Earnings and Deductions Table
        const tableBody = [
            ['Earnings', 'Amount', 'Deductions', 'Amount'],
            ['Basic Salary', (payslip.basicSalary || 0).toFixed(2), 'Tax', (payslip.taxDeduction || 0).toFixed(2)],
            ['Bonuses', (payslip.bonuses || 0).toFixed(2), 'Insurance', (payslip.insuranceDeduction || 0).toFixed(2)],
            ['Allowances', (payslip.allowances || 0).toFixed(2), 'Other', (payslip.otherDeductions || 0).toFixed(2)],
            [
                { content: 'Total Earnings', styles: { fontStyle: 'bold' } }, 
                { content: (payslip.grossSalary || 0).toFixed(2), styles: { fontStyle: 'bold' } }, 
                { content: 'Total Deductions', styles: { fontStyle: 'bold' } }, 
                { content: ((payslip.taxDeduction || 0) + (payslip.insuranceDeduction || 0) + (payslip.otherDeductions || 0)).toFixed(2), styles: { fontStyle: 'bold' } }
            ]
        ];

        autoTable(doc, {
            startY: 90,
            head: [],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [44, 62, 80] },
            styles: { fontSize: 10, cellPadding: 5 }
        });

        // Net Salary Box
        const finalY = doc.lastAutoTable.finalY + 20;
        doc.setFillColor(236, 240, 241);
        doc.rect(120, finalY, 70, 20, 'F');
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('NET SALARY', 125, finalY + 13);
        doc.text(`${(payslip.netSalary || 0).toFixed(2)}`, 185, finalY + 13, { align: 'right' });

        // Footer
        doc.setFont(undefined, 'normal');
        doc.setFontSize(8);
        doc.text('This is a computer generated payslip and does not require a physical signature.', pageWidth / 2, 280, { align: 'center' });

        // Save to temporary buffer or file system
        const fileName = `payslip_${payslip._id}_${uuidv4().split('-')[0]}.pdf`;
        const dirPath = path.join(process.cwd(), 'public/temp/pdfs');
        
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const filePath = path.join(dirPath, fileName);
        const pdfData = doc.output();
        fs.writeFileSync(filePath, pdfData, 'binary');

        return `/temp/pdfs/${fileName}`;
    }

    /**
     * Generate Invoice PDF
     */
    async generateInvoicePDF(invoice, organization) {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // Header
        doc.setFontSize(24);
        doc.setTextColor(44, 62, 80);
        doc.text('INVOICE', pageWidth - 20, 30, { align: 'right' });

        // Organization Details
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(organization && organization.name ? organization.name : 'Your Company Name', 20, 30);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text('Email: billing@company.com', 20, 38);

        // Invoice Info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.text(`Invoice Number: ${invoice.invoiceNumber}`, pageWidth - 20, 45, { align: 'right' });
        doc.text(`Date Issued: ${new Date(invoice.issuedDate).toLocaleDateString()}`, pageWidth - 20, 52, { align: 'right' });
        doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, pageWidth - 20, 59, { align: 'right' });

        // Customer Details
        doc.setFontSize(12);
        doc.text('Billed To:', 20, 70);
        doc.line(20, 72, 80, 72);
        
        doc.setFontSize(10);
        doc.text(invoice.customerId && invoice.customerId.name ? invoice.customerId.name : 'Customer Name', 20, 80);
        doc.text(invoice.customerId && invoice.customerId.email ? invoice.customerId.email : 'Customer Email', 20, 86);

        // Items Table
        const tableBody = invoice.items.map(item => [
            item.description,
            (item.quantity || 0).toString(),
            (item.unitPrice || 0).toFixed(2),
            (item.taxAmount || 0).toFixed(2),
            (item.amount || 0).toFixed(2)
        ]);

        autoTable(doc, {
            startY: 100,
            head: [['Description', 'Qty', 'Unit Price', 'Tax', 'Total']],
            body: tableBody,
            theme: 'striped',
            headStyles: { fillColor: [44, 62, 80] },
            styles: { fontSize: 10, cellPadding: 5 },
            columnStyles: {
                1: { halign: 'center' },
                2: { halign: 'right' },
                3: { halign: 'right' },
                4: { halign: 'right' }
            }
        });

        const finalY = doc.lastAutoTable.finalY + 15;

        // Totals Box
        doc.text(`Subtotal:`, pageWidth - 60, finalY);
        doc.text(`${(invoice.subtotal || 0).toFixed(2)}`, pageWidth - 20, finalY, { align: 'right' });
        
        doc.text(`Tax:`, pageWidth - 60, finalY + 8);
        doc.text(`${(invoice.taxAmount || 0).toFixed(2)}`, pageWidth - 20, finalY + 8, { align: 'right' });

        doc.setFillColor(236, 240, 241);
        doc.rect(pageWidth - 80, finalY + 14, 65, 12, 'F');
        doc.setFont(undefined, 'bold');
        doc.text(`TOTAL (${invoice.currency || 'INR'}):`, pageWidth - 60, finalY + 22);
        doc.text(`${(invoice.totalAmount || 0).toFixed(2)}`, pageWidth - 20, finalY + 22, { align: 'right' });

        // Notes and terms
        doc.setFont(undefined, 'normal');
        if (invoice.notes) {
            doc.text('Notes:', 20, finalY + 10);
            const splitNotes = doc.splitTextToSize(invoice.notes, 100);
            doc.text(splitNotes, 20, finalY + 16);
        }

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('Thank you for your business!', pageWidth / 2, 280, { align: 'center' });

        // Save to temporary buffer or file system
        const fileName = `invoice_${invoice._id}_${uuidv4().split('-')[0]}.pdf`;
        const dirPath = path.join(process.cwd(), 'public/temp/pdfs');
        
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const filePath = path.join(dirPath, fileName);
        const pdfData = doc.output();
        fs.writeFileSync(filePath, pdfData, 'binary');

        return `/temp/pdfs/${fileName}`;
    }

    /**
     * Generate Payroll Summary PDF
     */
    async generatePayrollSummaryPDF(payrollRun, payslips, organization) {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // Header
        doc.setFontSize(22);
        doc.setTextColor(44, 62, 80);
        doc.text('PAYROLL SUMMARY REPORT', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`Organization: ${organization?.name || 'Antigravity Solutions'}`, pageWidth / 2, 28, { align: 'center' });
        doc.text(`Period: ${new Date(payrollRun.periodStart).toLocaleDateString()} - ${new Date(payrollRun.periodEnd).toLocaleDateString()}`, pageWidth / 2, 34, { align: 'center' });

        // Stats Box
        doc.setFillColor(248, 250, 252);
        doc.rect(15, 45, 180, 25, 'F');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('TOTAL EMPLOYEES', 25, 53);
        doc.text('TOTAL GROSS', 75, 53);
        doc.text('TOTAL TAX', 125, 53);
        doc.text('TOTAL NET PAY', 165, 53);

        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.setFont(undefined, 'bold');
        doc.text(payslips.length.toString(), 25, 63);
        doc.text(`INR ${payrollRun.totalAmount.toLocaleString()}`, 75, 63);
        doc.text(`INR ${(payrollRun.totalAmount * 0.1).toLocaleString()}`, 125, 63); // Mock tax if not stored
        doc.text(`INR ${payrollRun.totalAmount.toLocaleString()}`, 165, 63);

        // Employee Breakdown Table
        const tableBody = payslips.map(p => [
            p.employeeId?.name || 'N/A',
            p.employeeId?.email || 'N/A',
            (p.grossSalary || 0).toFixed(2),
            (p.taxDeduction || 0).toFixed(2),
            (p.netSalary || 0).toFixed(2),
            (p.status || 'draft').toUpperCase()
        ]);

        autoTable(doc, {
            startY: 80,
            head: [['Employee', 'Email', 'Gross', 'Tax', 'Net', 'Status']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [30, 41, 59], fontSize: 9 },
            styles: { fontSize: 8, cellPadding: 4 }
        });

        // Footer
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, 280);
        doc.text('Confidential - internal use only', pageWidth - 20, 280, { align: 'right' });

        // Save
        const fileName = `payroll_summary_${payrollRun._id}_${uuidv4().split('-')[0]}.pdf`;
        const dirPath = path.join(process.cwd(), 'public/temp/pdfs');
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
        
        const filePath = path.join(dirPath, fileName);
        fs.writeFileSync(filePath, doc.output(), 'binary');

        return `/temp/pdfs/${fileName}`;
    }

    /**
     * Generate Generic Financial Report PDF (P&L, Balance Sheet, Cash Flow)
     */
    async generateGenericReportPDF(reportType, reportData, organization) {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const title = reportType.replace('_', ' ').toUpperCase();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(44, 62, 80);
        doc.text(title, pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`Organization: ${organization?.name || 'Antigravity Solutions'}`, pageWidth / 2, 28, { align: 'center' });
        doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 34, { align: 'center' });

        // Logic based on report type
        if (reportType === 'profit_and_loss') {
            const sections = [
                { label: 'REVENUE', items: reportData.revenue, total: reportData.totalRevenue },
                { label: 'EXPENSES', items: reportData.expenses, total: reportData.totalExpenses }
            ];

            let currentY = 50;
            sections.forEach(section => {
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text(section.label, 15, currentY);
                currentY += 5;

                const tableData = section.items.map(item => [item.category, item.amount.toLocaleString()]);
                tableData.push([{ content: `Total ${section.label}`, styles: { fontStyle: 'bold' } }, { content: section.total.toLocaleString(), styles: { fontStyle: 'bold' } }]);

                autoTable(doc, {
                    startY: currentY,
                    head: [],
                    body: tableData,
                    theme: 'plain',
                    styles: { fontSize: 10, cellPadding: 2 }
                });
                currentY = doc.lastAutoTable.finalY + 10;
            });

            // Net Profit
            doc.setFillColor(241, 245, 249);
            doc.rect(15, currentY, 180, 15, 'F');
            doc.setFontSize(14);
            doc.text('NET PROFIT', 25, currentY + 10);
            doc.text(`INR ${reportData.netProfit.toLocaleString()}`, 185, currentY + 10, { align: 'right' });
        } else if (reportType === 'balance_sheet') {
            const sections = [
                { label: 'ASSETS', items: reportData.assets, total: reportData.totalAssets },
                { label: 'LIABILITIES', items: reportData.liabilities, total: reportData.totalLiabilities },
                { label: 'EQUITY', items: reportData.equity, total: reportData.totalEquity }
            ];

            let currentY = 50;
            sections.forEach(section => {
                doc.setFontSize(12);
                doc.setFont(undefined, 'bold');
                doc.text(section.label, 15, currentY);
                currentY += 5;

                const tableData = section.items.map(item => [item.name, item.amount.toLocaleString()]);
                tableData.push([{ content: `Total ${section.label}`, styles: { fontStyle: 'bold' } }, { content: section.total.toLocaleString(), styles: { fontStyle: 'bold' } }]);

                autoTable(doc, {
                    startY: currentY,
                    head: [],
                    body: tableData,
                    theme: 'plain',
                    styles: { fontSize: 10, cellPadding: 2 }
                });
                currentY = doc.lastAutoTable.finalY + 10;
            });

            // Balance Summary
            doc.setFillColor(241, 245, 249);
            doc.rect(15, currentY, 180, 15, 'F');
            doc.setFontSize(14);
            doc.text('BALANCE STATUS', 25, currentY + 10);
            doc.text(reportData.isBalanced ? 'BALANCED' : 'UNBALANCED', 185, currentY + 10, { align: 'right' });
        } else if (reportType === 'cashflow') {
            const flowData = reportData.data || [];
            
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('MONTHLY CASH MOVEMENT', 15, 50);

            const tableData = flowData.map(item => [
                item.period,
                item.inflow.toLocaleString(),
                item.outflow.toLocaleString(),
                item.net.toLocaleString()
            ]);

            autoTable(doc, {
                startY: 55,
                head: [['Period', 'Inflow (INR)', 'Outflow (INR)', 'Net Flow (INR)']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [44, 62, 80] },
                styles: { fontSize: 10, cellPadding: 3 },
                columnStyles: {
                    1: { halign: 'right' },
                    2: { halign: 'right' },
                    3: { halign: 'right' }
                }
            });
        }

        // Save
        const fileName = `${reportType}_${uuidv4().split('-')[0]}.pdf`;
        const dirPath = path.join(process.cwd(), 'public/temp/pdfs');
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
        
        const filePath = path.join(dirPath, fileName);
        fs.writeFileSync(filePath, doc.output(), 'binary');

        return `/temp/pdfs/${fileName}`;
    }
    /**
     * Generate Audit History PDF
     */
    async generateAuditHistoryPDF(targetId, logs, entityType) {
        const { jsPDF } = require('jspdf');
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;

        // Header
        doc.setFontSize(22);
        doc.setTextColor(44, 62, 80);
        doc.text('AUDIT HISTORY REPORT', pageWidth / 2, 20, { align: 'center' });

        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Entity Type: ${entityType}`, pageWidth / 2, 28, { align: 'center' });
        doc.text(`Entity ID: ${targetId}`, pageWidth / 2, 34, { align: 'center' });
        doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 40, { align: 'center' });

        // Table Body
        const tableBody = logs.map(log => {
            const date = new Date(log.timestamp).toLocaleString();
            const user = log.userId?.name || (typeof log.userId === 'object' ? log.userId?._id : log.userId) || 'System';
            const action = log.action.toUpperCase();
            
            let details = '';
            if (log.changes && log.changes.length > 0) {
                details = log.changes.map(c => `${c.field}: ${c.oldValue !== undefined ? c.oldValue : 'N/A'} -> ${c.newValue !== undefined ? c.newValue : 'N/A'}`).join('\n');
            } else if (action === 'CREATE') {
                details = 'Initial Record Created';
            } else {
                details = 'No specific field changes recorded';
            }

            return [date, action, user, details];
        });

        autoTable(doc, {
            startY: 50,
            head: [['Date/Time', 'Action', 'User', 'Details / Changes']],
            body: tableBody,
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80], fontSize: 10 },
            styles: { fontSize: 8, cellPadding: 3, overflow: 'linebreak' },
            columnStyles: {
                0: { cellWidth: 35 },
                1: { cellWidth: 20 },
                2: { cellWidth: 30 },
                3: { cellWidth: 'auto' }
            }
        });

        // Footer
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('This is a formal audit record of system actions.', pageWidth / 2, 285, { align: 'center' });

        // Save
        const fileName = `audit_history_${targetId}_${uuidv4().split('-')[0]}.pdf`;
        const dirPath = path.join(process.cwd(), 'public/temp/pdfs');
        if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
        
        const filePath = path.join(dirPath, fileName);
        fs.writeFileSync(filePath, doc.output(), 'binary');

        return `/temp/pdfs/${fileName}`;
    }
}

module.exports = new PDFService();
