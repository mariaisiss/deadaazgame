const socket = io()

// Array que armazena as cartas
var images = [];
// Verificador para verificar a preseça do segundo jogar para desbloquear o tabuleiro
var canPlay = false;

// Objeto que representa o jogador
var player = {
	id: "",
	turn: false,
	points: 0
}

// Imagens de finalizacao do jogo
var modal1 = document.querySelector("#vence1");
var modal2 = document.querySelector("#vence2");
var modal3 = document.querySelector("#empate");

//imagem a ser exibida em caso de acerto
var matchSign = document.querySelector("#match");
	
//array que armazena as cartas viradas
var flippedCards = [];

//variável contadora de acertos. ao chegar em 8 o jogo termina
var matches = 0;

socket.on('connect', () => {
	socket.emit('connected', true);
	socket.on('getNumberOfPlayers', (numberOfPlayers) => {
		if(numberOfPlayers < 1) {
			player.id = "player1";
			player.turn = true;
			images = randomSort(images)
			socket.emit('sendImages', images);
			socket.emit('sendPlayerId', "player1", true);
			startGame(images);
			document.getElementById('player-id').textContent = "Jogador 1";
		} else {
			socket.on('loadImages', (currentImages) => {
				player.id = "player2";
				player.turn = false;
				socket.emit('sendPlayerId', "player2", false);
				images = currentImages;
				startGame(images)
				document.getElementById('player-id').textContent = "Jogador 2";
				canPlay = true;
				socket.emit('canPlay');
			});
		}
	});
});

socket.on('loadCardId', (card) => {
	auxFlipCard(card);
});

socket.on('sendErrorClick', (fCards) => {
	removeflippedCards(fCards);
});

socket.on('updateTurn', (id) => {
	if(player.id != id) {
		player.turn = true;
	}
});

socket.on('playerWinner', (id) => {
	if(id == "player1") {
		modal1.style.zIndex = "99";
	} else if(id == "player2") {
		modal2.style.zIndex = "99";
	} else {
		modal3.style.zIndex = "99";
	}
});

socket.on('updateCanPlay', (canPlayNow) => {
	canPlay = canPlayNow;
});

//estrutura de atribuição das imagens aos cards
for (var i = 0; i < 16; i++){
	//cria um objeto img com um src e um id
	var img = {
		src: "img/" + i + ".jpg",
		id: i%8
	};
		
	//inserer o objeto criado no array
	images.push(img);
}

function removeflippedCards(fCards){
    // Remove cartas que estão viradas
    document.getElementById(fCards[0]).children[0].className ="face back";
	document.getElementById(fCards[0]).children[1].className ="face front";

	document.getElementById(fCards[1]).children[0].className ="face back";
	document.getElementById(fCards[1]).children[1].className ="face front";

	// Zera o array de cartas viradas
	flippedCards = [];
}

//função de inicialização do jogo - distribui as cartas
function startGame(images){

	//zera o array de cartas viradas
	flippedCards = [];
		
	//zera o contador de acertos
	matches = 0;

	//aqui é chamada a função randomSort

	//lista de elementos div com as classes back e front
	var backFaces = document.getElementsByClassName("back");
	var frontFaces = document.getElementsByClassName("front");
		
	//posicionamento das cartas e adição do evento click
	for(var i = 0; i < 16; i++){
		//limpa as cartas marcadas
		backFaces[i].classList.remove("match","flipped");
		frontFaces[i].classList.remove("match","flipped");
			
		//posiciona as cartas no tabuleiro
		var card = document.querySelector("#card" + i);
		card.style.left = (i % 8) === 0 ? 5 + "px" : 5 + ((i % 8) * 165) + "px";
		card.style.top = i/8 >= 1 ? 250 + "px" : 5 + "px";
			
		//adiciona às cartas o evento click chamando a função que vira as cartas
		card.addEventListener("click",flipCard,false);
			
		//adiciona as imagens às cartas
		frontFaces[i].style.background = "url('" + images[i].src + "')";
		frontFaces[i].setAttribute("id",images[i].id);
	}
		
	//joga a imagem de game over para o plano de fundo
	modal1.style.zIndex = "-2";
	modal2.style.zIndex = "-3";
	modal3.style.zIndex = "-4";
		
	//remove o evento click da imagem de game over
	modal1.removeEventListener('click',function(){
		startGame();
	},false);
	modal2.removeEventListener('click',function(){
		startGame();
	},false);
	modal3.removeEventListener('click',function(){
		startGame();
	},false);
};//fim da função de inicialização do jogo

//função que vira as cartas espelhando a jogada do outro jogador.
function auxFlipCard(cardId){
	var card = document.getElementById(cardId);
	//verifica se o número de cartas viradas é menor que 2
	if(flippedCards.length < 2){
		//pega as faces da carta clicada
		var faces = card.getElementsByClassName("face");
		
		//confere se a carta já está virada, impedindo que a mesma carta seja virada duas vezes

		//adiciona a classe fliped às faces da carta para que sejam viradas
		faces[0].className="face back flipped";
		faces[1].className="face front flipped";
			
		//adiciona a carta clicada ao array de cartas viradas
		flippedCards.push(card);

		//verifica se o número de cartas no array de cartas viradas é igual a 2
		if(flippedCards.length === 2){
			//compara o id das cartas viradas para ver se houve um acerto
			if(flippedCards[0].childNodes[3].id === flippedCards[1].childNodes[3].id){
				//em caso de acerto adiciona a classe match a todas as faces das duas cartas presentes no array de cartas viradas
				flippedCards[0].childNodes[1].classList.toggle("match");
				flippedCards[0].childNodes[3].classList.toggle("match");
				flippedCards[1].childNodes[1].classList.toggle("match");
				flippedCards[1].childNodes[3].classList.toggle("match");

				//chama a função que exibe a mensagem MATCH
				matchCardsSign();
					
				//limpa o array de cartas viradas
				flippedCards = [];
					
				//soma um ao contador de acertos
				matches++;

				//verifica se o contador de acertos chegou a 8
				if(matches >= 8){
					//caso haja 8 acertos, chama a função que finaliza o jogo
					socket.emit('endGame');
				}
			}
		} 
	} else {
		//em caso haver duas cartas no array de cartas viradas (terceiro click) remove a classe flipped das cartas no array de cartas viradas
		flippedCards[0].childNodes[1].classList.toggle("flipped");
		flippedCards[0].childNodes[3].classList.toggle("flipped");
		flippedCards[1].childNodes[1].classList.toggle("flipped");
		flippedCards[1].childNodes[3].classList.toggle("flipped");
		
		//limpa o array de cartas viradas
		flippedCards = [];
	}

}

//função que vira as cartas do jogador atual
function flipCard() {

	if(player.turn && canPlay) {

		//verifica se o número de cartas viradas é menor que 2
		if(flippedCards.length < 2){
			//pega as faces da carta clicada
			var faces = this.getElementsByClassName("face");
				
			//confere se a carta já está virada, impedindo que a mesma carta seja virada duas vezes
			if(faces[0].classList[2]){
				return;
			}

			//adiciona a classe fliped às faces da carta para que sejam viradas
			faces[0].classList.toggle("flipped");
			faces[1].classList.toggle("flipped");
				
			//adiciona a carta clicada ao array de cartas viradas
			flippedCards.push(this);

			socket.emit('sendCardId', this.id);

			//verifica se o número de cartas no array de cartas viradas é igual a 2
			if(flippedCards.length === 2){
				//compara o id das cartas viradas para ver se houve um acerto
				if(flippedCards[0].childNodes[3].id === flippedCards[1].childNodes[3].id){
					//em caso de acerto adiciona a classe match a todas as faces das duas cartas presentes no array de cartas viradas
					flippedCards[0].childNodes[1].classList.toggle("match");
					flippedCards[0].childNodes[3].classList.toggle("match");
					flippedCards[1].childNodes[1].classList.toggle("match");
					flippedCards[1].childNodes[3].classList.toggle("match");

					player.points++;
					socket.emit('updatePoints', player.id);
					document.getElementById('points').textContent = `Points: ${player.points}`;

					//chama a função que exibe a mensagem MATCH
					matchCardsSign();
						
					//limpa o array de cartas viradas
					flippedCards = [];
						
					//soma um ao contador de acertos
					matches++;

					//verifica se o contador de acertos chegou a 8
					if(matches >= 8){
						//caso haja 8 acertos, chama a função que finaliza o jogo
						socket.emit('endGame');

					}
				}
			} 
		} else {
			//em caso haver duas cartas no array de cartas viradas (terceiro click) remove a classe flipped das cartas no array de cartas viradas
			flippedCards[0].childNodes[1].classList.toggle("flipped");
			flippedCards[0].childNodes[3].classList.toggle("flipped");
			flippedCards[1].childNodes[1].classList.toggle("flipped");
			flippedCards[1].childNodes[3].classList.toggle("flipped");
			
			// Emite para que outro jogar remova as flippedcards tambem
			var cardIdArray = []
			cardIdArray.push(flippedCards[0].id);
			cardIdArray.push(flippedCards[1].id);
			socket.emit('errorClick', cardIdArray);
			//limpa o array de cartas viradas
			flippedCards = [];

			player.turn = false;
			socket.emit('changeTurn', player.id);
		}

	}
	

}

//função que embaralha as cartas recebendo um array de cartas por parâmetro
function randomSort(array){
	//cria um array vazio
	var newArray = [];
		
	//executa a estrutura enquanto o novo array não atingir o mesmo número de elementos do arrau passado por parâmetro
	while(newArray.length !== array.length){
		//cria uma variável i recebendo um número aleatório entre 0 e o número de elementos no array -1
		var i = Math.floor(Math.random()*array.length);
			
		//verifica se o elemento indicado pelo índice i já existe no array novo
		if(newArray.indexOf(array[i]) < 0){
			//caso não exista é inserido
			newArray.push(array[i]);
		}
	}
		
	//retorna o array novo, que possui os elementos do array passado por parâmetro embaralhados
	return newArray;
};//fim da função que embaralha as cartas
	
//função que gera o sinal de MATCH
function matchCardsSign(){
	//joga a mensagem de MATCH para o primeiro plano
	matchSign.style.zIndex = "1";
		
	//deixa a mensagem transparente
	matchSign.style.opacity = "0";
		
	//move a mensagem para cima
	matchSign.style.top = "150px";
		
	//função executada após 1.5 segundo
	setTimeout(function(){
		//joga a mensagem de MATCH para o plano de fundo
		matchSign.style.zIndex = "-1";
			
		//remove a transparência da mansagem
		matchSign.style.opacity = "1";
			
		//move a mensagem para o centro da tela
		matchSign.style.top = "250px";
	},1500);
};//fim da função que exibe mensagem de MATCH
