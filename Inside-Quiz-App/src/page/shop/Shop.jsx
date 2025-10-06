import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Box,
  Chip,
  CircularProgress,
  Alert,
  Fab,
  Badge,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Inventory as InventoryIcon,
  Star as StarIcon,
  Close as CloseIcon,
  ShoppingCart as ShoppingCartIcon
} from '@mui/icons-material';
import './Shop.css';
import {
  loadShopItems,
  loadPlayerInventory,
  loadPlayerStats,
  purchaseItem,
  checkSession
} from '../../services/gameService';

export default function Shop() {
  const navigate = useNavigate();
  const [shopItems, setShopItems] = useState([]);
  const [inventory, setInventory] = useState([]); // Initialize as empty array instead of null
  const [playerStats, setPlayerStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [purchaseDialog, setPurchaseDialog] = useState(null);
  const [inventoryDialog, setInventoryDialog] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    initializeShop();
  }, []);

  const initializeShop = async () => {
    try {
      setLoading(true);
      
      // Check if user is logged in
      const session = await checkSession();
      if (!session.success) {
        setError('Vui lòng đăng nhập để xem shop');
        setLoading(false);
        return;
      }
      
      setIsLoggedIn(true);

      // Load shop items, player stats, and inventory
      const [shopResult, statsResult, inventoryResult] = await Promise.all([
        loadShopItems(),
        loadPlayerStats(),
        loadPlayerInventory()
      ]);

      if (shopResult.success) {
        setShopItems(shopResult.items || []);
      } else {
        throw new Error(shopResult.error);
      }

      if (statsResult.success) {
        setPlayerStats(statsResult.stats);
      }

      if (inventoryResult.success) {
        setInventory(inventoryResult.items || []); // Ensure it's always an array
      }

    } catch (error) {
      console.error('Shop initialization error:', error);
      setError(error.message || 'Không thể tải dữ liệu shop');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = (item) => {
    setPurchaseDialog(item);
  };

  const confirmPurchase = async () => {
    if (!purchaseDialog) return;

    try {
      setPurchasing(true);
      const result = await purchaseItem(purchaseDialog.id);
      
      if (result.success) {
        // Refresh player stats and inventory
        const [statsResult, inventoryResult] = await Promise.all([
          loadPlayerStats(),
          loadPlayerInventory()
        ]);
        
        if (statsResult.success) {
          setPlayerStats(statsResult.stats);
        }
        
        if (inventoryResult.success) {
          setInventory(inventoryResult.items || []); // Ensure it's always an array
        }
        
        setPurchaseDialog(null);
        // Show success message or animation
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Purchase error:', error);
      alert(error.message || 'Mua hàng thất bại');
    } finally {
      setPurchasing(false);
    }
  };

  const canAfford = (item) => {
    return playerStats && playerStats.total_score >= item.cost;
  };

  const isOwned = (item) => {
    // Ensure inventory is always an array and check by id only
    return Array.isArray(inventory) && inventory.some(invItem => invItem.id === item.id);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate('//')}>
          Về trang chủ
        </Button>
      </Container>
    );
  }

  return (
    <div className="shop-container">
      {/* Header */}
      <Box className="shop-header">
        <IconButton onClick={() => navigate('//')} className="back-button">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" className="shop-title">
          🛒 Shop Tích Lũy
        </Typography>
        <Box className="shop-points">
          <Chip
            icon={<StarIcon />}
            label={`${playerStats?.total_score || 0} điểm`}
            color="primary"
            size="large"
            className="points-chip"
          />
        </Box>
      </Box>

      {/* Shop Items Grid */}
      <Container maxWidth="lg" className="shop-content">
        <Grid container spacing={3} className="shop-items-grid">
          {shopItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
              <Card className={`shop-item-card ${isOwned(item) ? 'owned' : ''}`}>
                <CardMedia
                  component="img"
                  height="200"
                  image={item.image || `${import.meta.env.BASE_URL}image/default-item.png`}
                  alt={item.name}
                  className="item-image"
                />
                <CardContent>
                  <Typography variant="h6" className="item-name">
                    {item.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" className="item-description">
                    {item.description}
                  </Typography>
                  <Box className="item-footer">
                    <Chip
                      icon={<StarIcon />}
                      label={`${item.cost} điểm`}
                      color={canAfford(item) ? 'success' : 'error'}
                      size="small"
                    />
                    <Button
                      variant="contained"
                      size="small"
                      textTransform="none"
                      disabled={!canAfford(item) || isOwned(item)}
                      onClick={() => handlePurchase(item)}
                      className="purchase-button"
                      startIcon={<ShoppingCartIcon />}
                    >
                      {isOwned(item) ? 'Đã có' : 'Mua'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Inventory FAB */}
      <Tooltip title="Túi đồ">
        <Fab
          color="secondary"
          className="inventory-fab"
          onClick={() => setInventoryDialog(true)}
        >
          <Badge badgeContent={inventory.length} color="primary">
            <InventoryIcon />
          </Badge>
        </Fab>
      </Tooltip>

      {/* Purchase Confirmation Dialog */}
      <Dialog
        open={!!purchaseDialog}
        onClose={() => setPurchaseDialog(null)}
        maxWidth="sm"
        fullWidth
        className="purchase-dialog"
      >
        {purchaseDialog && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                Xác nhận mua hàng
                <IconButton onClick={() => setPurchaseDialog(null)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box className="purchase-content">
                <img
                  src={purchaseDialog.image || `${import.meta.env.BASE_URL}image/default-item.png`}
                  alt={purchaseDialog.name}
                  className="purchase-image"
                />
                <Typography variant="h6" gutterBottom>
                  {purchaseDialog.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {purchaseDialog.description}
                </Typography>
                <Box className="purchase-price">
                  <Chip
                    icon={<StarIcon />}
                    label={`${purchaseDialog.cost} điểm`}
                    color="primary"
                    size="large"
                  />
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setPurchaseDialog(null)} disabled={purchasing}>
                Hủy
              </Button>
              <Button
                onClick={confirmPurchase}
                variant="contained"
                disabled={purchasing || !canAfford(purchaseDialog)}
                startIcon={purchasing && <CircularProgress size={16} />}
              >
                {purchasing ? 'Đang mua...' : 'Xác nhận mua'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Inventory Dialog */}
      <Dialog
        open={inventoryDialog}
        onClose={() => setInventoryDialog(false)}
        maxWidth="md"
        fullWidth
        className="inventory-dialog"
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <InventoryIcon />
              Túi đồ của bạn
            </Box>
            <IconButton onClick={() => setInventoryDialog(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {inventory.length === 0 ? (
            <Box className="empty-inventory">
              <Typography variant="h6" color="text.secondary">
                Túi đồ trống
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Hãy mua một số vật phẩm từ shop!
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {inventory.map((item, index) => (
                <Grid item xs={6} sm={4} md={3} key={index}>
                  <Card className="inventory-item">
                    <CardMedia
                      component="img"
                      height="120"
                      image={item.image || `${import.meta.env.BASE_URL}image/default-item.png`}
                      alt={item.name}
                    />
                    <CardContent>
                      <Typography variant="body2" className="inventory-item-name">
                        {item.name}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
