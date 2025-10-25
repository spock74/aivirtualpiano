# AI Virtual Piano

Este é um projeto de um piano virtual controlado por gestos de mão, utilizando inteligência artificial para detecção de movimentos. O projeto está em sua fase totalmente inicial de desenvolvimento.

## Tecnologias Utilizadas

*   **React:** Biblioteca para construção da interface de usuário.
*   **Vite:** Ferramenta de build e desenvolvimento rápido.
*   **TypeScript:** Superset de JavaScript que adiciona tipagem estática.
*   **MediaPipe:** Framework do Google para construção de pipelines de machine learning, utilizado aqui para o reconhecimento de gestos de mão.

## Funcionalidades Atuais

*   Exibição da imagem da webcam para interação.
*   Sobreposição de um piano virtual na tela.
*   Controle da posição do piano.
*   Opção de espelhar o vídeo horizontalmente e verticalmente.
*   Ajuste de sensibilidade para a detecção de movimentos.

## Como Executar o Projeto

1.  **Clone o repositório:**
    ```bash
    # (Adicione o comando para clonar seu repositório aqui)
    ```

2.  **Instale as dependências:**
    ```bash
    npm install
    ```

3.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm run dev
    ```

Abra o seu navegador e acesse o endereço fornecido pelo Vite (normalmente `http://localhost:5173`).

## Estrutura do Projeto

*   `App.tsx`: Componente principal que renderiza a aplicação.
*   `components/VirtualPiano.tsx`: O coração da aplicação, onde a lógica de detecção de gestos e a interação com o piano acontecem.
*   `services/audioPlayer.ts`: Serviço para carregar e tocar os sons do piano.
*   `constants.ts`: Arquivo para armazenar constantes utilizadas no projeto.
*   `index.html`: Ponto de entrada da aplicação web.
*   `package.json`: Define os scripts e dependências do projeto.

---
*Este README foi gerado com base na análise do código em estágio inicial.*
