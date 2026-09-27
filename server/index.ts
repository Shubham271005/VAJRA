import { app } from './app';

const PORT = parseInt(process.env.PORT || '3001', 10);

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`  VAJRA SIH 2026 AI Nowcasting Local Backend API`);
  console.log(`  Running at: http://localhost:${PORT}`);
  console.log(`  Status: ONLINE (Deterministic Simulation Mode)`);
  console.log(`====================================================`);
});
