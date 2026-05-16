import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

/**
 * Suspense fallback — mostrato durante lo streaming-RSC mentre il server completa
 * l'async work della route. Senza questo, navigare a una route async hangs su pagina vuota.
 *
 * Usa lo Skeleton MUI con shape coerenti col layout app (eyebrow + title + body + griglia card).
 */
export default function Loading() {
  return (
    <Container
      component="main"
      maxWidth="lg"
      sx={{ py: { xs: 6, md: 10 }, px: { xs: 3, sm: 4, md: 6 } }}
    >
      <Stack spacing={4}>
        <Skeleton variant="text" width={120} height={16} />
        <Skeleton variant="text" width="60%" height={56} />
        <Skeleton variant="text" width="80%" height={20} />
        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            mt: 4,
          }}
        >
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} variant="rounded" height={180} />
          ))}
        </Box>
      </Stack>
    </Container>
  );
}
