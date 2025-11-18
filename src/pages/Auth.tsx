import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, CreditCard, Lock, Monitor, Lock as LockIcon, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [registerNome, setRegisterNome] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerCelular, setRegisterCelular] = useState('');
  const [registerCpfCnpj, setRegisterCpfCnpj] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(loginEmail, loginPassword);

    if (error) {
      let errorMessage = error.message;
      
      // Melhorar mensagens de erro
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Email ou senha incorretos. Verifique suas credenciais.';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada.';
      }

      toast({
        title: 'Erro ao fazer login',
        description: errorMessage,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Login realizado com sucesso!',
        description: 'Bem-vindo ao sistema.',
      });
    }

    setLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!forgotPasswordEmail) {
      toast({
        title: 'Erro',
        description: 'Por favor, informe seu email.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    const { error } = await resetPassword(forgotPasswordEmail);

    if (error) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível enviar o email de recuperação.',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Email enviado!',
        description: 'Verifique sua caixa de entrada para redefinir sua senha.',
      });
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    }

    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerPassword !== registerConfirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem.',
        variant: 'destructive',
      });
      return;
    }

    if (registerPassword.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error, data } = await signUp(registerEmail, registerPassword, {
      nome: registerNome,
      celular: registerCelular,
      cpf_cnpj: registerCpfCnpj,
    });

    if (error) {
      toast({
        title: 'Erro ao cadastrar',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      // Verificar se precisa confirmar email
      const needsConfirmation = data?.user && !data?.session;
      
      toast({
        title: 'Cadastro realizado com sucesso!',
        description: needsConfirmation 
          ? 'Verifique sua caixa de entrada para confirmar seu email antes de fazer login.'
          : 'Você pode fazer login agora.',
      });
      setIsLogin(true);
      // Limpar formulário
      setRegisterNome('');
      setRegisterEmail('');
      setRegisterCelular('');
      setRegisterCpfCnpj('');
      setRegisterPassword('');
      setRegisterConfirmPassword('');
    }

    setLoading(false);
  };

  const formatCPFCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      // CPF
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    } else {
      // CNPJ
      return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Garantia Técnica</CardTitle>
          <CardDescription>
            Sistema de gestão de garantias e manutenções
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? 'login' : 'register'} onValueChange={(v) => setIsLogin(v === 'login')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="register">Cadastrar</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              {!showForgotPassword ? (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Senha</Label>
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-sm text-primary hover:underline"
                      >
                        Esqueci minha senha
                      </button>
                    </div>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="forgot-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={forgotPasswordEmail}
                        onChange={(e) => setForgotPasswordEmail(e.target.value)}
                        className="pl-10"
                        required
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Enviaremos um link para redefinir sua senha no seu email.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? 'Enviando...' : 'Enviar'}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setShowForgotPassword(false);
                        setForgotPasswordEmail('');
                      }}
                      disabled={loading}
                    >
                      Cancelar
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-nome">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-nome"
                      type="text"
                      placeholder="Seu nome completo"
                      value={registerNome}
                      onChange={(e) => setRegisterNome(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-email">E-mail</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-celular">Número de Celular</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-celular"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={registerCelular}
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value);
                        setRegisterCelular(formatted);
                      }}
                      className="pl-10"
                      maxLength={15}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-cpf-cnpj">CPF ou CNPJ</Label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="register-cpf-cnpj"
                      type="text"
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      value={registerCpfCnpj}
                      onChange={(e) => {
                        const formatted = formatCPFCNPJ(e.target.value);
                        setRegisterCpfCnpj(formatted);
                      }}
                      className="pl-10"
                      maxLength={18}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-password">Senha</Label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-confirm-password">Confirmar Senha</Label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={registerConfirmPassword}
                    onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Cadastrando...' : 'Cadastrar'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;

