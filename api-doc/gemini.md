# Chat（聊天）

## OpenAPI Specification

```yaml
openapi: 3.0.1
info:
  title: ''
  description: ''
  version: 1.0.0
paths:
  /chat/completions:
    post:
      summary: Chat（聊天）
      deprecated: false
      description: "支持模型：\ngemini-exp-1114\ngemini-exp-1121\ngemini-exp-1206\ngemini-2.0-flash-exp\ngemini-2.0-flash-thinking-exp-1219\ngemini-2.0-flash-thinking-exp-01-21\t\ngemini-2.0-flash\ngemini-2.0-flash-lite-preview-02-05\ngemini-2.0-pro-exp-02-05\ngemini-2.5-pro-exp-03-25\ngemini-2.5-pro-preview-03-25\ngemini-2.5-flash-preview-04-17\ngemini-2.5-pro-preview-05-06\ngemini-2.5-pro-preview-05-06-thinking（展示思考过程）\ngemini-2.5-flash-preview-05-20\ngemini-2.5-flash-preview-05-20-nothink（强制关闭思考）\ngemini-2.5-pro-preview-06-05\ngemini-2.5-pro-preview-06-05-thinking（展示思考过程）\ngemini-2.5-pro\t\ngemini-2.5-flash\t\ngemini-2.5-flash-lite-preview-06-17\ngemini-3-pro-preview\n\n\n注意：我们对API的格式进行了改造，兼容了OpenAI的API格式\n\n**价格请查看：https://302.ai/price**"
      tags:
        - 语言大模型/Gemini
      parameters:
        - name: Content-Type
          in: header
          description: ''
          required: true
          example: application/json
          schema:
            type: string
        - name: Accept
          in: header
          description: ''
          required: true
          example: application/json
          schema:
            type: string
        - name: Authorization
          in: header
          description: ''
          required: false
          example: Bearer {{YOUR_API_KEY}}
          schema:
            type: string
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                model:
                  type: string
                  description: >-
                    要使用的模型的 ID。有关哪些模型适用于聊天 API
                    的详细信息，请参阅[模型端点兼容性表。](https://platform.openai.com/docs/models/model-endpoint-compatibility)
                messages:
                  type: array
                  items:
                    type: object
                    properties:
                      role:
                        type: string
                      content:
                        type: string
                    x-apifox-orders:
                      - role
                      - content
                  description: >-
                    以[聊天格式](https://platform.openai.com/docs/guides/chat/introduction)生成聊天完成的消息。
                temperature:
                  type: integer
                  description: >-
                    使用什么采样温度，介于 0 和 2 之间。较高的值（如 0.8）将使输出更加随机，而较低的值（如
                    0.2）将使输出更加集中和确定。  我们通常建议改变这个或`top_p`但不是两者。
                top_p:
                  type: integer
                  description: >-
                    一种替代温度采样的方法，称为核采样，其中模型考虑具有 top_p 概率质量的标记的结果。所以 0.1 意味着只考虑构成前
                    10% 概率质量的标记。  我们通常建议改变这个或`temperature`但不是两者。
                'n':
                  type: integer
                  description: 为每个输入消息生成多少个聊天完成选项。
                stream:
                  type: boolean
                  description: >-
                    如果设置，将发送部分消息增量，就像在 ChatGPT
                    中一样。当令牌可用时，令牌将作为纯数据[服务器发送事件](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events/Using_server-sent_events#Event_stream_format)`data:
                    [DONE]`发送，流由消息终止。[有关示例代码](https://github.com/openai/openai-cookbook/blob/main/examples/How_to_stream_completions.ipynb)，请参阅
                    OpenAI Cookbook 。
                stop:
                  type: string
                  description: API 将停止生成更多令牌的最多 4 个序列。
                max_tokens:
                  type: integer
                  description: 聊天完成时生成的最大令牌数。  输入标记和生成标记的总长度受模型上下文长度的限制。
                presence_penalty:
                  type: number
                  description: >-
                    -2.0 和 2.0 之间的数字。正值会根据到目前为止是否出现在文本中来惩罚新标记，从而增加模型谈论新主题的可能性。 
                    [查看有关频率和存在惩罚的更多信息。](https://platform.openai.com/docs/api-reference/parameter-details)
                frequency_penalty:
                  type: number
                  description: >-
                    -2.0 和 2.0 之间的数字。正值会根据新标记在文本中的现有频率对其进行惩罚，从而降低模型逐字重复同一行的可能性。 
                    [查看有关频率和存在惩罚的更多信息。](https://platform.openai.com/docs/api-reference/parameter-details)
                logit_bias:
                  type: 'null'
                  description: >-
                    修改指定标记出现在完成中的可能性。  接受一个 json 对象，该对象将标记（由标记器中的标记 ID 指定）映射到从
                    -100 到 100 的关联偏差值。从数学上讲，偏差会在采样之前添加到模型生成的 logits
                    中。确切的效果因模型而异，但 -1 和 1 之间的值应该会减少或增加选择的可能性；像 -100 或 100
                    这样的值应该导致相关令牌的禁止或独占选择。
                user:
                  type: string
                  description: >-
                    代表您的最终用户的唯一标识符，可以帮助 OpenAI
                    监控和检测滥用行为。[了解更多](https://platform.openai.com/docs/guides/safety-best-practices/end-user-ids)。
              required:
                - model
                - messages
              x-apifox-orders:
                - model
                - messages
                - temperature
                - top_p
                - 'n'
                - stream
                - stop
                - max_tokens
                - presence_penalty
                - frequency_penalty
                - logit_bias
                - user
            example:
              model: gemini-1.5-pro
              messages:
                - role: user
                  content: 你是谁
      responses:
        '200':
          description: ''
          content:
            application/json:
              schema:
                type: object
                properties:
                  id:
                    type: string
                  object:
                    type: string
                  created:
                    type: integer
                  choices:
                    type: array
                    items:
                      type: object
                      properties:
                        index:
                          type: integer
                        message:
                          type: object
                          properties:
                            role:
                              type: string
                            content:
                              type: string
                          required:
                            - role
                            - content
                          x-apifox-orders:
                            - role
                            - content
                        finish_reason:
                          type: string
                      x-apifox-orders:
                        - index
                        - message
                        - finish_reason
                  usage:
                    type: object
                    properties:
                      prompt_tokens:
                        type: integer
                      completion_tokens:
                        type: integer
                      total_tokens:
                        type: integer
                    required:
                      - prompt_tokens
                      - completion_tokens
                      - total_tokens
                    x-apifox-orders:
                      - prompt_tokens
                      - completion_tokens
                      - total_tokens
                required:
                  - id
                  - object
                  - created
                  - choices
                  - usage
                x-apifox-orders:
                  - id
                  - object
                  - created
                  - choices
                  - usage
          headers: {}
          x-apifox-name: OK
      security: []
      x-apifox-folder: 语言大模型/Gemini
      x-apifox-status: released
      x-run-in-apifox: https://app.apifox.com/web/project/4012774/apis/api-147522041-run
components:
  schemas: {}
  securitySchemes:
    apiKeyAuth:
      type: apikey
      in: header
      name: Authorization
servers:
  - url: https://api.302.ai
    description: 正式环境
  - url: https://api.302ai.cn
    description: 国内中转
security: []

```
