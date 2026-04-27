================================================================================
FRONT LOG — Secretaria Escolar Frontend
Stack: Angular 17 Standalone + Spring Boot 3 + PostgreSQL
================================================================================

================================================================================
PASSO 1 — Criação dos Angular Services (camada HTTP) com notificação reativa
================================================================================

────────────────────────────────────────────────────────────
VISÃO GERAL
────────────────────────────────────────────────────────────
Foi implementada a camada de **Services** do frontend, espelhando 1-para-1 os
controllers REST do backend Spring Boot. Cada recurso de domínio (Aluno, Turma,
Nota, Frequência, Matrícula, Documento, Usuário) ganhou um service standalone
injetável em raiz (`providedIn: 'root'`), tipado de forma estrita, retornando
sempre `Observable<T>` e jamais subscrevendo internamente — a subscrição é
responsabilidade exclusiva da camada de componentes.

Cada service expõe, além dos métodos CRUD, um **Subject privado** (`xxxAtualizado`)
e o respectivo **stream público read-only** (`xxxAtualizado$`). Toda mutação de
estado no servidor (POST/PUT/PATCH/DELETE) emite um sinal nesse Subject via
operador `tap()`. Isso permite que listas, dashboards e contadores na UI
recarreguem-se automaticamente após qualquer modificação, sem acoplamento direto
entre componentes.

Como a chave de configuração `environment.apiUrl` era requerida pelo padrão do
projeto mas o arquivo `environment.ts` ainda usava `apiBaseUrl` (legado do
auth.service), o campo foi padronizado para `apiUrl` em todos os ambientes
(dev e prod) e o `auth.service.ts` foi ajustado para a nova convenção. Esse
fix elimina divergência que faria os services falharem em runtime.

Esta camada é o **único ponto de contato HTTP** com o backend — qualquer
componente, guard ou interceptor que precise falar com a API obrigatoriamente
passa por aqui. Próximas camadas (componentes de listagem, formulários e
guards de role) consumirão estes services.

────────────────────────────────────────────────────────────
ARQUIVOS CRIADOS/ALTERADOS
────────────────────────────────────────────────────────────

Caminho: src/environments/environment.ts (ALTERADO)

ANTES:
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080'
};
```

DEPOIS:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080'
};
```

Motivo: padronizar a chave para `apiUrl` (convenção do projeto). Sem isso, todos
os services novos quebrariam em runtime ao tentar ler `environment.apiUrl`.

────────────────────────────────────────────────────────────

Caminho: src/environments/environment.prod.ts (ALTERADO)

ANTES:
```typescript
export const environment = {
  production: true,
  apiBaseUrl: '<URL_PROD>'
};
```

DEPOIS:
```typescript
export const environment = {
  production: true,
  apiUrl: '<URL_PROD>'
};
```

Motivo: simetria com o environment de desenvolvimento. Ambos os arquivos devem
expor as mesmas chaves para que `ng build --configuration production` substitua
corretamente.

────────────────────────────────────────────────────────────

Caminho: src/app/core/services/auth.service.ts (ALTERADO — apenas linha 23)

ANTES:
```typescript
private readonly apiUrl = `${environment.apiBaseUrl}/auth`;
```

DEPOIS:
```typescript
private readonly apiUrl = `${environment.apiUrl}/auth`;
```

Motivo: `auth.service.ts` era o último consumidor do nome antigo `apiBaseUrl`.
Renomear sem atualizá-lo geraria erro de compilação TypeScript.

────────────────────────────────────────────────────────────

Caminho: src/app/features/alunos/services/aluno.service.ts

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

import { AlunoRequest } from '../../../core/models/requests/aluno.request';
import { AlunoResponse } from '../../../core/models/responses/aluno.response';
import { FrequenciaResumoResponse } from '../../../core/models/responses/frequencia-resumo.response';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AlunoService {
  private readonly apiUrl = `${environment.apiUrl}/aluno`;

  private alunoAtualizado = new Subject<void>();
  alunoAtualizado$ = this.alunoAtualizado.asObservable();

  constructor(private http: HttpClient) {}

  findAll(): Observable<AlunoResponse[]> {
    return this.http.get<AlunoResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<AlunoResponse> {
    return this.http.get<AlunoResponse>(`${this.apiUrl}/${id}`);
  }

  save(request: AlunoRequest): Observable<AlunoResponse> {
    return this.http
      .post<AlunoResponse>(this.apiUrl, request)
      .pipe(tap(() => this.alunoAtualizado.next()));
  }

  update(id: number, request: AlunoRequest): Observable<AlunoResponse> {
    return this.http
      .put<AlunoResponse>(`${this.apiUrl}/${id}`, request)
      .pipe(tap(() => this.alunoAtualizado.next()));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.alunoAtualizado.next()));
  }

  getFrequencias(id: number): Observable<FrequenciaResumoResponse[]> {
    return this.http.get<FrequenciaResumoResponse[]>(`${this.apiUrl}/${id}/frequencias`);
  }
}
```

────────────────────────────────────────────────────────────

Caminho: src/app/features/turmas/services/turma.service.ts

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

import { TurmaRequest } from '../../../core/models/requests/turma.request';
import { TurmaResponse } from '../../../core/models/responses/turma.response';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TurmaService {
  private readonly apiUrl = `${environment.apiUrl}/turma`;

  private turmaAtualizada = new Subject<void>();
  turmaAtualizada$ = this.turmaAtualizada.asObservable();

  constructor(private http: HttpClient) {}

  findAll(): Observable<TurmaResponse[]> {
    return this.http.get<TurmaResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<TurmaResponse> {
    return this.http.get<TurmaResponse>(`${this.apiUrl}/${id}`);
  }

  save(request: TurmaRequest): Observable<TurmaResponse> {
    return this.http
      .post<TurmaResponse>(this.apiUrl, request)
      .pipe(tap(() => this.turmaAtualizada.next()));
  }

  update(id: number, request: TurmaRequest): Observable<TurmaResponse> {
    return this.http
      .put<TurmaResponse>(`${this.apiUrl}/${id}`, request)
      .pipe(tap(() => this.turmaAtualizada.next()));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.turmaAtualizada.next()));
  }
}
```

────────────────────────────────────────────────────────────

Caminho: src/app/features/notas/services/nota.service.ts

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

import { NotaRequest } from '../../../core/models/requests/nota.request';
import { NotaResponse } from '../../../core/models/responses/nota.response';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NotaService {
  private readonly apiUrl = `${environment.apiUrl}/nota`;

  private notaAtualizada = new Subject<void>();
  notaAtualizada$ = this.notaAtualizada.asObservable();

  constructor(private http: HttpClient) {}

  findAll(): Observable<NotaResponse[]> {
    return this.http.get<NotaResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<NotaResponse> {
    return this.http.get<NotaResponse>(`${this.apiUrl}/${id}`);
  }

  save(request: NotaRequest): Observable<NotaResponse> {
    return this.http
      .post<NotaResponse>(this.apiUrl, request)
      .pipe(tap(() => this.notaAtualizada.next()));
  }

  update(id: number, request: NotaRequest): Observable<NotaResponse> {
    return this.http
      .put<NotaResponse>(`${this.apiUrl}/${id}`, request)
      .pipe(tap(() => this.notaAtualizada.next()));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.notaAtualizada.next()));
  }
}
```

────────────────────────────────────────────────────────────

Caminho: src/app/features/frequencias/services/frequencia.service.ts

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

import { FrequenciaRequest } from '../../../core/models/requests/frequencia.request';
import { FrequenciaResponse } from '../../../core/models/responses/frequencia.response';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FrequenciaService {
  private readonly apiUrl = `${environment.apiUrl}/frequencia`;

  private frequenciaAtualizada = new Subject<void>();
  frequenciaAtualizada$ = this.frequenciaAtualizada.asObservable();

  constructor(private http: HttpClient) {}

  findAll(): Observable<FrequenciaResponse[]> {
    return this.http.get<FrequenciaResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<FrequenciaResponse> {
    return this.http.get<FrequenciaResponse>(`${this.apiUrl}/${id}`);
  }

  save(request: FrequenciaRequest): Observable<FrequenciaResponse> {
    return this.http
      .post<FrequenciaResponse>(this.apiUrl, request)
      .pipe(tap(() => this.frequenciaAtualizada.next()));
  }

  update(id: number, request: FrequenciaRequest): Observable<FrequenciaResponse> {
    return this.http
      .put<FrequenciaResponse>(`${this.apiUrl}/${id}`, request)
      .pipe(tap(() => this.frequenciaAtualizada.next()));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.frequenciaAtualizada.next()));
  }
}
```

────────────────────────────────────────────────────────────

Caminho: src/app/features/matriculas/services/matricula.service.ts

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

import { MatriculaRequest } from '../../../core/models/requests/matricula.request';
import { MatriculaStatusRequest } from '../../../core/models/requests/matricula-status.request';
import { MatriculaResponse } from '../../../core/models/responses/matricula.response';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MatriculaService {
  private readonly apiUrl = `${environment.apiUrl}/matricula`;

  private matriculaAtualizada = new Subject<void>();
  matriculaAtualizada$ = this.matriculaAtualizada.asObservable();

  constructor(private http: HttpClient) {}

  findAll(): Observable<MatriculaResponse[]> {
    return this.http.get<MatriculaResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<MatriculaResponse> {
    return this.http.get<MatriculaResponse>(`${this.apiUrl}/${id}`);
  }

  save(request: MatriculaRequest): Observable<MatriculaResponse> {
    return this.http
      .post<MatriculaResponse>(this.apiUrl, request)
      .pipe(tap(() => this.matriculaAtualizada.next()));
  }

  update(id: number, request: MatriculaRequest): Observable<MatriculaResponse> {
    return this.http
      .put<MatriculaResponse>(`${this.apiUrl}/${id}`, request)
      .pipe(tap(() => this.matriculaAtualizada.next()));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.matriculaAtualizada.next()));
  }

  updateStatus(id: number, request: MatriculaStatusRequest): Observable<MatriculaResponse> {
    return this.http
      .patch<MatriculaResponse>(`${this.apiUrl}/${id}/status`, request)
      .pipe(tap(() => this.matriculaAtualizada.next()));
  }
}
```

────────────────────────────────────────────────────────────

Caminho: src/app/features/documentos/services/documento.service.ts

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

import { DocumentoRequest } from '../../../core/models/requests/documento.request';
import { DocumentoResponse } from '../../../core/models/responses/documento.response';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DocumentoService {
  private readonly apiUrl = `${environment.apiUrl}/documento`;

  private documentoAtualizado = new Subject<void>();
  documentoAtualizado$ = this.documentoAtualizado.asObservable();

  constructor(private http: HttpClient) {}

  findAll(): Observable<DocumentoResponse[]> {
    return this.http.get<DocumentoResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<DocumentoResponse> {
    return this.http.get<DocumentoResponse>(`${this.apiUrl}/${id}`);
  }

  save(request: DocumentoRequest): Observable<DocumentoResponse> {
    return this.http
      .post<DocumentoResponse>(this.apiUrl, request)
      .pipe(tap(() => this.documentoAtualizado.next()));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.documentoAtualizado.next()));
  }
}
```

────────────────────────────────────────────────────────────

Caminho: src/app/features/usuarios/services/usuario.service.ts

```typescript
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, tap } from 'rxjs';

import { UsuarioRequest } from '../../../core/models/requests/usuario.request';
import { UsuarioResponse } from '../../../core/models/responses/usuario.response';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private readonly apiUrl = `${environment.apiUrl}/usuario`;

  private usuarioAtualizado = new Subject<void>();
  usuarioAtualizado$ = this.usuarioAtualizado.asObservable();

  constructor(private http: HttpClient) {}

  findAll(): Observable<UsuarioResponse[]> {
    return this.http.get<UsuarioResponse[]>(this.apiUrl);
  }

  findById(id: number): Observable<UsuarioResponse> {
    return this.http.get<UsuarioResponse>(`${this.apiUrl}/${id}`);
  }

  save(request: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http
      .post<UsuarioResponse>(this.apiUrl, request)
      .pipe(tap(() => this.usuarioAtualizado.next()));
  }

  update(id: number, request: UsuarioRequest): Observable<UsuarioResponse> {
    return this.http
      .put<UsuarioResponse>(`${this.apiUrl}/${id}`, request)
      .pipe(tap(() => this.usuarioAtualizado.next()));
  }

  delete(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/${id}`)
      .pipe(tap(() => this.usuarioAtualizado.next()));
  }
}
```

────────────────────────────────────────────────────────────
MACRO — Analogia e contexto
────────────────────────────────────────────────────────────
Pense em cada Service como o **garçom de uma mesa específica** num restaurante.
O `AlunoService` só atende pedidos de aluno. Ele leva o pedido (request) até a
cozinha (Spring Boot) e traz o prato pronto (response) — nunca cozinha nada,
nunca decide o cardápio, nunca arruma a mesa.

A novidade dessa rodada é o **sino na mesa**: cada vez que o garçom traz um
prato novo, modifica um pedido ou retira um item da mesa, ele toca um sino
(o `Subject`). Quem estiver ouvindo aquele sino específico (uma listagem
aberta em outra aba do app, por exemplo) sabe que precisa pedir o cardápio
de novo para ver o estado atualizado. Ninguém precisa ficar perguntando
"e aí, mudou alguma coisa?" — quem mudou avisa.

O **sino** (`Subject`) fica privado: só o próprio garçom toca. Quem está fora
só pode **escutar** através do canal público (`xxxAtualizado$`). Esse encaps-
ulamento impede que componentes maliciosos ou bugados disparem notificações
falsas.

────────────────────────────────────────────────────────────
FLUXO DE EXECUÇÃO
────────────────────────────────────────────────────────────
Cenário: usuário clica em "Salvar" num formulário de Aluno.

[Componente AlunoFormComponent]
        │
        │ chama alunoService.save(request)
        ↓
[AlunoService.save()]
        │
        ├── monta a chamada HTTP POST → environment.apiUrl + "/aluno"
        │
        ↓
[HttpClient]
        │
        ├── injeta header Authorization (via JwtInterceptor — futuro passo)
        │
        ↓
[Spring Boot — AlunoController.save()]
        │
        ├── valida, persiste no PostgreSQL
        │
        ↓ retorna AlunoResponse (201 Created)
[HttpClient devolve Observable<AlunoResponse>]
        │
        ↓
[.pipe(tap(() => this.alunoAtualizado.next()))]
        │
        ├── EFEITO COLATERAL: emite sinal no Subject
        │
        │       ↓
        │   [Outros componentes inscritos em alunoAtualizado$]
        │       └── AlunoListComponent recarrega findAll()
        │
        ↓
[Subscribe do AlunoFormComponent recebe o AlunoResponse]
        └── exibe toast "Aluno salvo!" e fecha modal

────────────────────────────────────────────────────────────
MICRO — Destrinchamento linha a linha
────────────────────────────────────────────────────────────

`import { Observable, Subject, tap } from 'rxjs';`
   → Importa apenas o que será usado de RxJS — o tree-shaking do Angular
     elimina o resto do bundle final.
   → POR QUÊ: Imports nominais são obrigatórios em projetos modernos.
     Alternativa inferior: `import * as rxjs from 'rxjs'` — quebra
     tree-shaking e infla o bundle em ~150 kB.

`@Injectable({ providedIn: 'root' })`
   → Registra o service como singleton no injector raiz da aplicação.
   → POR QUÊ: Em projeto 100% standalone (sem NgModule), `providedIn: 'root'`
     é a forma idiomática de garantir uma única instância compartilhada e
     suporte a tree-shaking — se nenhum componente injetar o service, ele
     é removido do bundle.
   → Alternativa inferior: declarar em `providers: []` de um componente
     pai — geraria múltiplas instâncias e duplicaria os Subjects, perdendo
     o sincronismo entre telas.

`private readonly apiUrl = \`${environment.apiUrl}/aluno\`;`
   → Concatena a URL base do environment com o caminho do recurso.
   → POR QUÊ: `readonly` impede sobrescrita acidental em runtime;
     `private` impede acesso externo. URL no singular (`/aluno`) por
     convenção do backend Spring.
   → Alternativa inferior: hardcode `'http://localhost:8080/aluno'` —
     quebraria deploy em produção e dificultaria testes.

`private alunoAtualizado = new Subject<void>();`
   → Cria o emissor de eventos. Tipo `void` porque o sinal não carrega
     payload — o consumidor sabe apenas que "algo mudou".
   → POR QUÊ: `Subject` (não `BehaviorSubject`) porque não há valor
     inicial significativo — quem se inscreve depois de uma mudança
     antiga não precisa saber dela. Apenas eventos futuros importam.
   → Alternativa inferior: `BehaviorSubject<void>` — entregaria um
     evento "fantasma" no momento da subscrição, causando recarga
     desnecessária na primeira renderização.

`alunoAtualizado$ = this.alunoAtualizado.asObservable();`
   → Expõe um Observable read-only do Subject privado.
   → POR QUÊ: padrão de encapsulamento. Componentes só podem
     **ouvir**, nunca **emitir**. Sufixo `$` é convenção da comunidade
     Angular para indicar Observable.
   → Alternativa inferior: expor o Subject diretamente como público —
     qualquer componente poderia chamar `.next()` e disparar
     notificações falsas, quebrando a fonte da verdade.

`constructor(private http: HttpClient) {}`
   → Injeção de dependência via construtor TypeScript shorthand.
   → POR QUÊ: padrão Angular. O modificador `private` no parâmetro
     já declara e atribui o campo automaticamente.
   → Alternativa inferior: usar `inject(HttpClient)` standalone helper.
     Funcional, mas o construtor é mais explícito para seniores
     vindos de Angular pré-14 e facilita mock em testes unitários.

`findAll(): Observable<AlunoResponse[]> { return this.http.get<...>(...); }`
   → GET puro, sem side-effects. Não dispara `next()` no Subject
     porque LEITURA não muda o estado servidor — não há razão para
     notificar terceiros.
   → POR QUÊ: separação clara entre comandos (que mutam) e queries
     (que leem). Princípio CQRS aplicado em pequena escala.

`save(request).pipe(tap(() => this.alunoAtualizado.next()))`
   → Após o POST retornar com sucesso, emite o sinal de atualização.
   → POR QUÊ usar `tap` e não `map`: `tap` executa side-effect SEM
     transformar o valor que flui. O subscriber do componente continua
     recebendo o `AlunoResponse` original, intacto.
   → POR QUÊ DENTRO do `.pipe()`, não fora: se eu chamasse
     `this.alunoAtualizado.next()` antes do `return`, o sinal seria
     emitido ANTES da requisição completar — antes mesmo de o servidor
     confirmar a gravação. Componentes recarregariam dados velhos.
     Dentro do `tap`, o `next()` só dispara após o servidor confirmar.
   → Alternativa inferior: `subscribe` no próprio service para
     disparar o `next()`. PROIBIDO pela regra do projeto: services
     não subscrevem.

`getFrequencias(id: number): Observable<FrequenciaResumoResponse[]>`
   → Endpoint de relacionamento (aluno → frequências). Pertence ao
     `AlunoService` porque o backend o expõe sob `/aluno/:id/frequencias`.
   → POR QUÊ aqui e não no `FrequenciaService`: a URL pertence ao
     namespace `/aluno`, e a chamada é uma "view de aluno". Mover
     para o outro service quebraria a regra de espelhar o controller.

`updateStatus(id, request)` (apenas em MatriculaService)
   → Usa `PATCH` em vez de `PUT` porque o backend expõe um endpoint
     parcial (atualiza só o campo `status`).
   → POR QUÊ: `PATCH` é semanticamente correto para mutações parciais
     (RFC 5789). Usar `PUT` exigiria enviar a matrícula inteira e
     mudaria o contrato com o backend.

DocumentoService NÃO tem `update`:
   → O backend não expõe `PUT /documento/:id`. Documento, uma vez
     emitido, é imutável (regra de negócio: histórico escolar não
     pode ser reescrito). Apenas criação e exclusão.
   → POR QUÊ não criar o método "por garantia": adicionar um método
     que o backend não suporta produziria um 405 Method Not Allowed
     em runtime — pior do que o erro de compilação que TypeScript
     daria se o método não existir e fosse chamado.

────────────────────────────────────────────────────────────
TABELA DE RESPONSABILIDADE
────────────────────────────────────────────────────────────

  Responsabilidade                                | Service | Outro
  ------------------------------------------------|---------|------------------
  Montar URL do endpoint                          | ✅      | —
  Tipar request/response                          | ✅      | (modelos em core)
  Chamar HttpClient                               | ✅      | —
  Notificar mudanças via Subject                  | ✅      | —
  Subscribe / unsubscribe                         | ❌      | Componente ✅
  Tratar erros e exibir toast                     | ❌      | Componente / Interceptor
  Anexar Authorization header                     | ❌      | JwtInterceptor (próximo)
  Cache de respostas                              | ❌      | (não há requisito ainda)
  Validação de formulário                         | ❌      | Reactive Forms ✅
  Roteamento após sucesso                         | ❌      | Componente ✅
  Lógica de negócio (cálculo de média, etc.)      | ❌      | Backend ✅
  Mapear DTO → ViewModel                          | ❌      | Componente / pipe ✅

────────────────────────────────────────────────────────────
PRÓXIMO PASSO
────────────────────────────────────────────────────────────
Implementar o **JwtInterceptor** em `src/app/core/interceptors/jwt.interceptor.ts`
e registrá-lo via `provideHttpClient(withInterceptors([jwtInterceptor]))` no
`app.config.ts`. Sem ele, todas as chamadas dos services partirão sem o header
`Authorization: Bearer <token>` e o backend devolverá 401 Unauthorized para
qualquer rota protegida.

Em seguida, criar o **HttpErrorInterceptor** para padronizar tratamento de
erros (401 → logout automático; 403 → toast "sem permissão"; 5xx → toast
genérico) e libertar componentes de boilerplate de erro.

================================================================================
FIM DO PASSO 1
================================================================================
