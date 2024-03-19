export const predicates = {
  'verification-predicate': {
    abi: {
      types: [
        {
          typeId: 0,
          type: 'b256',
          components: null,
          typeParameters: null,
        },
        {
          typeId: 1,
          type: 'bool',
          components: null,
          typeParameters: null,
        },
        {
          typeId: 2,
          type: 'u64',
          components: null,
          typeParameters: null,
        },
      ],
      functions: [
        {
          inputs: [
            {
              name: 'witness_index',
              type: 2,
              typeArguments: null,
            },
          ],
          name: 'main',
          output: {
            name: '',
            type: 1,
            typeArguments: null,
          },
          attributes: null,
        },
      ],
      loggedTypes: [],
      messagesTypes: [],
      configurables: [
        {
          name: 'SIGNER',
          configurableType: {
            name: '',
            type: 0,
            typeArguments: null,
          },
          offset: 384,
        },
      ],
    },
    bytecode: base64ToUint8Array(
      'dAAAA0cAAAAAAAAAAAABgF38wAEQ//MAGuxQAJEAATBxRAADYUkSAHZIAAJhQRIMdAAAB3JMAAITSSTAWkkgAXZIAAJhQRJKdAAAASQAAABdQQAAYUEEAVBHsKAa6QAAGuUQACD4MwBY++ACUPvgBHQAACoaS9AAUEOw8HJEAEAoQSRAUEOw8BpEAABySABAKO0EgFBDsGBdS/AFEEkjAHJMACAoQSTAUEuwgHJMACAoSRTAGkewAEBBFIAaQIAAE0EAQHZAAAlQQ7BQX+wAClBFAA9cS/AgXkUgAFBHsOBySAAQKEUEgHQAAAZQQ7BAX+wQCF/sAAlQR7DgckgAEChFBIBdQ7AcE0EAAFxH8CB2QAABGkQAACREAAAa8FAAkQAAKF/xAABf8RABX/EgAl/xMANf87AEGuxQAJEAAAAaQ6AAGkeQABpL4AByTABAKEUEwBr1EACSAAAAGvkgAFnwUChdQ8AAXUfAAV1LwAJdT8ADXe/ABJIAAChK+AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAGA'
    ),
  },
};

function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}
