from api.utils.imports import *

@csrf_exempt
@api_view(['POST'])
def get_mcq(request):
    try:
        data = request.data
        input_text = data.get("input_text", "")
        use_mediawiki = data.get("use_mediawiki", 0)
        max_questions = data.get("max_questions", 4)
        
        processed_text = process_input_text(input_text, use_mediawiki)
        output = MCQGen.generate_mcq({"input_text": processed_text, "max_questions": max_questions})
        if isinstance(output, dict):
            questions = output.get("questions", [])
        elif isinstance(output, list):
            questions = output
        else:
            questions = []
            
        return Response({"output": questions})
    
    except Exception as e:
        return Response({"error": str(e)}, status=500)


@csrf_exempt
@api_view(['POST'])
def get_boolq(request):
    data = request.data
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    max_questions = data.get("max_questions", 4)
    input_text = process_input_text(input_text, use_mediawiki)
    output = BoolQGen.generate_boolq(
        {"input_text": input_text, "max_questions": max_questions}
    )
    boolean_questions = output["Boolean_Questions"]
    return Response({"output": boolean_questions})

@csrf_exempt
@api_view(['POST'])
def get_shortq(request):
    data = request.data
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    max_questions = data.get("max_questions", 4)
    input_text = process_input_text(input_text, use_mediawiki)
    output = ShortQGen.generate_shortq(
        {"input_text": input_text, "max_questions": max_questions}
    )
    questions = output["questions"]
    return Response({"output": questions})

@csrf_exempt
@api_view(['POST'])
def get_problems(request):
    data = request.data
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    max_questions_mcq = data.get("max_questions_mcq", 4)
    max_questions_boolq = data.get("max_questions_boolq", 4)
    max_questions_shortq = data.get("max_questions_shortq", 4)
    input_text = process_input_text(input_text, use_mediawiki)
    output1 = MCQGen.generate_mcq(
        {"input_text": input_text, "max_questions": max_questions_mcq}
    )
    output2 = BoolQGen.generate_boolq(
        {"input_text": input_text, "max_questions": max_questions_boolq}
    )
    output3 = ShortQGen.generate_shortq(
        {"input_text": input_text, "max_questions": max_questions_shortq}
    )
    return Response(
        {"output_mcq": output1, "output_boolq": output2, "output_shortq": output3}
    )

@csrf_exempt
@api_view(['POST'])
def get_shortq_hard(request):
    data = request.data
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    input_text = process_input_text(input_text,use_mediawiki)
    input_questions = data.get("input_question", [])
    output = qg.generate(
        article=input_text, num_questions=input_questions, answer_style="sentences"
    )
    return Response({"output": output})


@csrf_exempt
@api_view(['POST'])
def get_mcq_hard(request):
    data = request.data
    input_text = data.get("input_text", "")
    use_mediawiki = data.get("use_mediawiki", 0)
    input_text = process_input_text(input_text,use_mediawiki)
    input_questions = data.get("input_question", [])
    output = qg.generate(
        article=input_text, num_questions=input_questions, answer_style="multiple_choice"
    )
    return Response({"output": output})