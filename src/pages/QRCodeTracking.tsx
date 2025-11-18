import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, Search, Package, Wrench, Calendar, User, Building2, MapPin, Camera, X, Upload } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Html5Qrcode } from "html5-qrcode";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const QRCodeTracking = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [skuInput, setSkuInput] = useState("");
  const [equipment, setEquipment] = useState<any>(null);
  const [maintenances, setMaintenances] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerElementId = "qr-reader";
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = async () => {
    if (!skuInput.trim()) {
      toast({
        title: "Erro",
        description: "Digite um SKU/ID para buscar.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Buscar equipamento pelo SKU
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipments')
        .select(`
          *,
          customers(nome_empresa, email, telefone, endereco)
        `)
        .eq('sku', skuInput.trim())
        .eq('user_id', user.id)
        .single();

      if (equipmentError || !equipmentData) {
        toast({
          title: "Equipamento não encontrado",
          description: "Nenhum equipamento encontrado com este SKU/ID.",
          variant: "destructive",
        });
        setEquipment(null);
        setMaintenances([]);
        return;
      }

      setEquipment(equipmentData);

      // Buscar manutenções deste equipamento
      const { data: maintenancesData, error: maintenancesError } = await supabase
        .from('maintenances')
        .select('*')
        .eq('equipment_id', equipmentData.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!maintenancesError && maintenancesData) {
        setMaintenances(maintenancesData);
      }
    } catch (error) {
      console.error('Erro ao buscar equipamento:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao buscar o equipamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const startScanner = async () => {
    try {
      setShowScanner(true);
      setScanning(true);
      
      // Aguardar um pouco para o DOM atualizar
      await new Promise(resolve => setTimeout(resolve, 100));

      const html5QrCode = new Html5Qrcode(scannerElementId);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" }, // Usar câmera traseira
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // QR code escaneado com sucesso
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Ignorar erros de leitura (são normais durante a varredura)
        }
      );
    } catch (error: any) {
      console.error('Erro ao iniciar scanner:', error);
      setScanning(false);
      toast({
        title: "Erro ao acessar câmera",
        description: error.message || "Não foi possível acessar a câmera. Verifique as permissões.",
        variant: "destructive",
      });
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.error('Erro ao parar scanner:', error);
      }
    }
    setScanning(false);
    setShowScanner(false);
  };

  const handleScanSuccess = async (decodedText: string) => {
    // Parar o scanner
    await stopScanner();
    
    // Preencher o campo com o valor escaneado
    setSkuInput(decodedText);
    
    // Fazer a busca automaticamente
    // Usar setTimeout para garantir que o estado foi atualizado
    setTimeout(() => {
      handleSearchWithSku(decodedText);
    }, 100);
  };

  const handleSearchWithSku = async (sku: string) => {
    if (!sku.trim()) {
      return;
    }

    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Buscar equipamento pelo SKU
      const { data: equipmentData, error: equipmentError } = await supabase
        .from('equipments')
        .select(`
          *,
          customers(nome_empresa, email, telefone, endereco)
        `)
        .eq('sku', sku.trim())
        .eq('user_id', user.id)
        .single();

      if (equipmentError || !equipmentData) {
        toast({
          title: "Equipamento não encontrado",
          description: "Nenhum equipamento encontrado com este SKU/ID.",
          variant: "destructive",
        });
        setEquipment(null);
        setMaintenances([]);
        return;
      }

      setEquipment(equipmentData);

      // Buscar manutenções deste equipamento
      const { data: maintenancesData, error: maintenancesError } = await supabase
        .from('maintenances')
        .select('*')
        .eq('equipment_id', equipmentData.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (!maintenancesError && maintenancesData) {
        setMaintenances(maintenancesData);
      }

      toast({
        title: "QR Code escaneado!",
        description: "Equipamento encontrado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao buscar equipamento:', error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao buscar o equipamento.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Verificar se é uma imagem
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo de imagem.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Criar elemento temporário para o scanner
      const tempElementId = "temp-qr-scanner-" + Date.now();
      const tempDiv = document.createElement('div');
      tempDiv.id = tempElementId;
      tempDiv.style.display = 'none';
      document.body.appendChild(tempDiv);

      const html5QrCode = new Html5Qrcode(tempElementId);
      
      // Escanear QR code da imagem
      const decodedText = await html5QrCode.scanFile(file, false);
      
      // Limpar elemento temporário
      document.body.removeChild(tempDiv);
      
      // Limpar o input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Processar o resultado
      setSkuInput(decodedText);
      handleSearchWithSku(decodedText);
    } catch (error: any) {
      console.error('Erro ao escanear imagem:', error);
      toast({
        title: "Erro ao escanear",
        description: "Não foi possível encontrar um QR code na imagem. Verifique se a imagem contém um QR code válido.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Limpar scanner quando o componente for desmontado
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background p-4">
        <div className="flex items-center gap-2">
          <SidebarTrigger />
          <h1 className="text-2xl font-bold text-foreground">Rastreamento QR Code</h1>
        </div>
      </header>

      <div className="p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              Buscar Equipamento por SKU/ID
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor="sku">SKU/ID do Equipamento</Label>
                <Input
                  id="sku"
                  placeholder="Digite ou escaneie o SKU/ID"
                  value={skuInput}
                  onChange={(e) => setSkuInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Enviar Imagem
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={startScanner}
                  disabled={scanning || loading}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Escanear QR Code
                </Button>
                <Button onClick={handleSearch} disabled={loading}>
                  <Search className="h-4 w-4 mr-2" />
                  {loading ? "Buscando..." : "Buscar"}
                </Button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </CardContent>
        </Card>

        {equipment && (
          <>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Informações do Equipamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label className="text-muted-foreground">Nome</Label>
                    <p className="text-lg font-semibold">{equipment.nome}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">SKU/ID</Label>
                    <p className="text-lg font-semibold">{equipment.sku}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Modelo</Label>
                    <p className="text-lg">{equipment.modelo || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Número de Série</Label>
                    <p className="text-lg">{equipment.numero_serie || '-'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Quantidade</Label>
                    <p className="text-lg">{equipment.quantidade || 1}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Localização</Label>
                    <p className="text-lg flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {equipment.localizacao || '-'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Garantia</Label>
                    <p className="text-lg">
                      {equipment.garantia_validade 
                        ? new Date(equipment.garantia_validade).toLocaleDateString('pt-BR')
                        : 'Sem garantia'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Cliente</Label>
                    <p className="text-lg flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {equipment.customers?.nome_empresa || '-'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Histórico de Manutenções ({maintenances.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {maintenances.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma manutenção registrada para este equipamento.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {maintenances.map((maintenance) => (
                      <Card key={maintenance.id} className="border-l-4 border-l-primary">
                        <CardContent className="pt-4">
                          <div className="grid gap-2 md:grid-cols-2">
                            <div>
                              <Label className="text-muted-foreground">OS #{maintenance.numero_os || maintenance.id}</Label>
                            </div>
                            <div className="text-right">
                              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                                maintenance.status === 'concluida' 
                                  ? "bg-green-100 text-green-600 border border-green-300" 
                                  : maintenance.status === 'pendente'
                                  ? "bg-red-100 text-red-600 border border-red-300"
                                  : "bg-yellow-100 text-yellow-600 border border-yellow-300"
                              }`}>
                                {maintenance.status === 'concluida' ? 'Finalizado' : 
                                 maintenance.status === 'pendente' ? 'Pendente' : 
                                 maintenance.status === 'em_andamento' ? 'Em Andamento' : 'Cancelada'}
                              </span>
                            </div>
                            {maintenance.data_abertura && (
                              <div>
                                <Label className="text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Data de Abertura
                                </Label>
                                <p>{new Date(maintenance.data_abertura).toLocaleDateString('pt-BR')}</p>
                              </div>
                            )}
                            {maintenance.data_termino && (
                              <div>
                                <Label className="text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Data de Término
                                </Label>
                                <p>{new Date(maintenance.data_termino).toLocaleDateString('pt-BR')}</p>
                              </div>
                            )}
                            {maintenance.tecnico_responsavel && (
                              <div>
                                <Label className="text-muted-foreground flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  Técnico Responsável
                                </Label>
                                <p>{maintenance.tecnico_responsavel}</p>
                              </div>
                            )}
                            {maintenance.problema && (
                              <div className="md:col-span-2">
                                <Label className="text-muted-foreground">Problema Relatado</Label>
                                <p className="text-sm">{maintenance.problema}</p>
                              </div>
                            )}
                            {maintenance.observacoes && (
                              <div className="md:col-span-2">
                                <Label className="text-muted-foreground">Observações</Label>
                                <p className="text-sm">{maintenance.observacoes}</p>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Dialog do Scanner */}
        <Dialog open={showScanner} onOpenChange={(open) => {
          if (!open) {
            stopScanner();
          }
        }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Escanear QR Code</DialogTitle>
              <DialogDescription>
                Posicione o QR code dentro da área de leitura. A câmera será acessada automaticamente.
              </DialogDescription>
            </DialogHeader>
            <div className="w-full">
              <div id={scannerElementId} className="w-full rounded-lg overflow-hidden"></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={stopScanner}>
                <X className="h-4 w-4 mr-2" />
                Fechar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default QRCodeTracking;

