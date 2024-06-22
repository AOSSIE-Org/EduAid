
const { PDFDocument } = PDFLib

async function createAnswerKey() {
  const titleInput = document.getElementById("title-input").value;
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([550, 750])
  const form = pdfDoc.getForm()
  var d = new Date(Date.now());
  page.drawText('EduAid generated Quiz for : ' + titleInput, { x: 50, y: 700, size: 20 })
  page.drawText('Created On:' + d.toString(),{ x: 50, y: 670, size: 10 })
  const qaPairs=JSON.parse(localStorage.getItem("qaPairs"));
  var x =10;
  var y =30;
  var ct = 1;
  for (const [question,answer] of Object.entries(qaPairs)){
    page.drawText("Q"+ct.toString()+") "+question, { x: 50, y: 600+y,size: 15 })
    page.drawText("Answer: ", { x: 50, y: 580+y,size: 15 })
    const answerField = form.createTextField('question'+answer)
    answerField.setText(answer)
    answerField.addToPage(page, { x: 50, y: 540+y,size:10 })
    y=y-120;
    ct+=1;
  }
  
  const pdfBytes = await pdfDoc.save()
  const ans  = titleInput+ "_answerKey"+".pdf"
  download(pdfBytes,ans, "application/pdf");
}

async function createQuestions() {
  const titleInput = document.getElementById("title-input").value;
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage([550, 750])
  const form = pdfDoc.getForm()
  var d = new Date(Date.now());
  page.drawText('EduAid generated Quiz for : ' + titleInput, { x: 50, y: 700, size: 20 })
  page.drawText('Created On:' + d.toString(),{ x: 50, y: 670, size: 10 })
  const qaPairs=JSON.parse(localStorage.getItem("qaPairs"));
  var x =10;
  var y =30;
  var ct = 1;
  for (const [question,answer] of Object.entries(qaPairs)){
    page.drawText("Q"+ct.toString()+") "+question, { x: 50, y: 600+y,size: 15 })
    page.drawText("Answer: ", { x: 50, y: 580+y,size: 15 })
    const answerField = form.createTextField('question'+answer)
    answerField.setText("")
    answerField.addToPage(page, { x: 50, y: 540+y,size:10 })
    y=y-120;
    ct+=1;
  }
  const ques = titleInput+".pdf"
  const pdfBytes = await pdfDoc.save()
  download(pdfBytes,ques, "application/pdf");
}
document.addEventListener("DOMContentLoaded", function(){
    const saveButton= document.getElementById("save-button");
    const backButton= document.getElementById("back-button");
    const answerButton= document.getElementById("answer-button");
    const viewQuestionsButton = document.getElementById("view-questions-button");
    const qaPairs=JSON.parse(localStorage.getItem("qaPairs"));
    const modalClose= document.querySelector("[data-close-modal]");
    const modal=document.querySelector("[data-modal]");


    viewQuestionsButton.addEventListener("click", function(){
      const modalQuestionList = document.getElementById("modal-question-list");
      modalQuestionList.innerHTML = ""; // Clear previous content

      for (const [question, answer] of Object.entries(qaPairs)) {
          const questionElement = document.createElement("li");
          questionElement.textContent = `Question: ${question}, Answer: ${answer}`;
          modalQuestionList.appendChild(questionElement)
      }
      modal.showModal();
    });

    modalClose.addEventListener("click", function(){
      modal.close();
    });
    saveButton.addEventListener("click", async function(){
      createQuestions();
    });
    answerButton.addEventListener("click", async function(){
      createAnswerKey();
    });
      
      backButton.addEventListener("click", function(){
        window.location.href="../html/text_input.html"
      });
});